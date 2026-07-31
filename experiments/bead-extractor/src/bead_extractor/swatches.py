from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

import cv2
import numpy as np

from .models import CellEstimate, GridGeometry, PaletteColor
from .palette import delta_e_ciede2000, rgb_to_lab


@dataclass(frozen=True, slots=True)
class SwatchDetection:
    active_indexes: tuple[int, ...] | None
    diagnostics: dict[str, object]
    assigned_indexes: tuple[int, ...] | None = None
    prototype_labs: tuple[tuple[float, float, float], ...] | None = None


def detect_palette_swatches(
    image_rgb: np.ndarray,
    grid: GridGeometry,
    palette: tuple[PaletteColor, ...],
    color_offset_lab: np.ndarray,
    cells: list[CellEstimate],
) -> SwatchDetection:
    """Find colour-table swatches below a board without reading their labels."""
    # Skip the one-cell coordinate/footer band immediately outside the logical
    # board.  It is a regular glyph row, not a colour table.
    start_y = max(0, int(np.floor(grid.bottom + 1.40 * grid.pitch_y)))
    if image_rgb.shape[0] - start_y < max(3, 0.35 * grid.pitch_y):
        return SwatchDetection(None, {"enabled": False, "reason": "no-lower-margin"})
    crop = image_rgb[start_y:]
    border_pixels = np.concatenate(
        [
            crop[: min(2, len(crop))].reshape(-1, 3),
            crop[-min(2, len(crop)) :].reshape(-1, 3),
        ]
    )
    background = np.median(border_pixels, axis=0)
    foreground_distance = np.linalg.norm(crop.astype(np.float64) - background, axis=2)
    row_activity = np.mean(foreground_distance > 12, axis=1)
    threshold = max(0.025, float(np.quantile(row_activity, 0.70)) * 0.24)
    active_rows = (row_activity >= threshold).astype(np.uint8)
    close_height = max(1, int(round(0.25 * grid.pitch_y)))
    active_rows = cv2.morphologyEx(
        active_rows.reshape(-1, 1),
        cv2.MORPH_CLOSE,
        np.ones((close_height, 1), np.uint8),
    ).ravel()
    bands = [
        (first, last)
        for first, last in _true_runs(active_rows)
        if last - first >= max(2, 0.20 * grid.pitch_y)
    ]
    if not bands:
        return SwatchDetection(None, {"enabled": False, "reason": "no-swatch-bands"})

    lab = cv2.cvtColor(crop, cv2.COLOR_RGB2LAB).astype(np.float64)
    strongest_band = max(
        bands, key=lambda band: np.mean(row_activity[band[0] : band[1]])
    )
    swatch_pitch, phase, phase_score = _swatch_lattice(
        lab[strongest_band[0] : strongest_band[1]], grid.pitch_x
    )
    if swatch_pitch is None or phase is None:
        return SwatchDetection(
            None,
            {
                "enabled": False,
                "reason": "no-regular-swatch-boundaries",
                "bands": bands,
            },
        )

    observed_swatches: list[np.ndarray] = []
    slot_boxes: list[tuple[int, int, int, int]] = []
    for first, last in bands:
        positions = np.arange(phase, crop.shape[1] + swatch_pitch, swatch_pitch)
        positions = positions[
            (positions >= -0.25 * swatch_pitch)
            & (positions <= crop.shape[1] + 0.25 * swatch_pitch)
        ]
        if len(positions) < 2:
            continue
        activities = []
        for left, right in zip(positions[:-1], positions[1:], strict=True):
            x0 = max(0, int(np.ceil(left)))
            x1 = min(crop.shape[1], int(np.floor(right)))
            patch_distance = foreground_distance[first:last, x0:x1]
            activities.append(
                float(np.mean(patch_distance > 10)) if patch_distance.size else 0.0
            )
        occupied = np.asarray(activities) >= 0.10
        runs = _true_runs(occupied.astype(np.uint8))
        if not runs:
            continue
        # Export colour tables start at the left and use contiguous equal-width
        # slots.  Ignore detached watermark/text components farther right.
        run = min(runs, key=lambda value: value[0])
        for slot in range(run[0], run[1]):
            left, right = positions[slot], positions[slot + 1]
            x0 = max(0, int(np.ceil(left + 0.05 * swatch_pitch)))
            x1 = min(crop.shape[1], int(np.floor(right - 0.05 * swatch_pitch)))
            y0 = max(0, first)
            y1 = min(crop.shape[0], last)
            patch = crop[y0:y1, x0:x1]
            if patch.size == 0:
                continue
            observed_swatches.append(_dominant_rgb(patch))
            slot_boxes.append((x0, start_y + y0, x1, start_y + y1))

    if len(observed_swatches) < 4:
        return SwatchDetection(
            None,
            {
                "enabled": False,
                "reason": "too-few-swatch-slots",
                "bands": bands,
                "swatchPitch": swatch_pitch,
                "slotCount": len(observed_swatches),
            },
        )

    raw_observed_labs = rgb_to_lab(np.asarray(observed_swatches))
    observed_labs = raw_observed_labs + color_offset_lab
    palette_labs = rgb_to_lab(np.asarray([color.rgb for color in palette], dtype=float))
    observed_labs = _fit_swatch_colour_transform(
        raw_observed_labs, observed_labs, palette_labs
    )
    distances = delta_e_ciede2000(observed_labs, palette_labs)
    cell_support = Counter(cell.code for cell in cells if not cell.is_empty)
    selected = _ordered_palette_assignment(distances, palette, cell_support)
    selected_distances = distances[np.arange(len(distances)), selected]

    median_distance = float(np.median(selected_distances))
    unique_fraction = len(set(selected.tolist())) / len(selected)
    confidence = float(
        np.clip(
            0.45 * min(1.0, len(selected) / 12)
            + 0.25 * unique_fraction
            + 0.20 * np.clip(1 - median_distance / 12, 0, 1)
            + 0.10 * np.clip(phase_score / 3, 0, 1),
            0,
            1,
        )
    )
    # Ordered assignment can always manufacture unique codes when an unrelated
    # text row happens to look periodic.  Actual image-local swatches must also
    # agree photometrically with the palette and have a repeat signal above the
    # surrounding glyph noise.
    enabled = (
        confidence >= 0.62
        and unique_fraction >= 0.85
        and median_distance <= 6.0
        and phase_score >= 1.0
    )
    diagnostics: dict[str, object] = {
        "enabled": enabled,
        "confidence": confidence,
        "bands": [[start_y + first, start_y + last] for first, last in bands],
        "swatchPitch": swatch_pitch,
        "phase": phase,
        "phaseScore": phase_score,
        "slotCount": len(selected),
        "uniqueColorCount": len(set(selected.tolist())),
        "medianPaletteDeltaE": median_distance,
        "codes": [palette[int(index)].canonical_code for index in selected],
        "slotBoxes": slot_boxes,
    }
    if not enabled:
        diagnostics["reason"] = "swatch-layout-or-colour-match-is-ambiguous"
        return SwatchDetection(None, diagnostics)
    return SwatchDetection(
        tuple(sorted(set(selected.tolist()))),
        diagnostics,
        tuple(int(index) for index in selected),
        tuple(tuple(float(value) for value in lab) for lab in raw_observed_labs),
    )


def _fit_swatch_colour_transform(
    raw_labs: np.ndarray,
    initial_labs: np.ndarray,
    palette_labs: np.ndarray,
) -> np.ndarray:
    calibrated = initial_labs.copy()
    design = np.column_stack((raw_labs, np.ones(len(raw_labs))))
    for _ in range(4):
        distances = delta_e_ciede2000(calibrated, palette_labs)
        order = np.argsort(distances, axis=1)
        best = order[:, 0]
        margins = (
            distances[np.arange(len(distances)), order[:, 1]]
            - distances[np.arange(len(distances)), best]
        )
        selected = (distances[np.arange(len(distances)), best] < 3.2) & (margins > 0.35)
        if np.count_nonzero(selected) < 6:
            break
        coefficients = np.linalg.lstsq(
            design[selected], palette_labs[best[selected]], rcond=None
        )[0]
        predicted = design @ coefficients
        calibrated = 0.30 * calibrated + 0.70 * predicted
    return calibrated


def _ordered_palette_assignment(
    distances: np.ndarray,
    palette: tuple[PaletteColor, ...],
    cell_support: Counter[str],
) -> np.ndarray:
    """Match swatches to canonical display order with dynamic programming."""
    swatch_count, palette_count = distances.shape
    if swatch_count > palette_count:
        return np.argmin(distances, axis=1)
    supports = np.asarray(
        [cell_support[color.canonical_code] for color in palette], dtype=np.float64
    )
    maximum_support = float(np.max(supports)) if len(supports) else 0.0
    support_penalty = 0.18 * np.log((maximum_support + 1) / (supports + 1))
    costs = distances + support_penalty[None, :]
    impossible = np.inf
    dynamic = np.full((swatch_count, palette_count), impossible)
    previous = np.full((swatch_count, palette_count), -1, dtype=int)
    dynamic[0, : palette_count - swatch_count + 1] = costs[
        0, : palette_count - swatch_count + 1
    ]
    for swatch in range(1, swatch_count):
        prefix_best = np.minimum.accumulate(dynamic[swatch - 1])
        prefix_index = np.empty(palette_count, dtype=int)
        best_index = 0
        for index in range(palette_count):
            if dynamic[swatch - 1, index] < dynamic[swatch - 1, best_index]:
                best_index = index
            prefix_index[index] = best_index
        minimum_palette = swatch
        maximum_palette = palette_count - (swatch_count - swatch)
        for palette_index in range(minimum_palette, maximum_palette + 1):
            prior_index = prefix_index[palette_index - 1]
            prior_cost = prefix_best[palette_index - 1]
            if np.isfinite(prior_cost):
                dynamic[swatch, palette_index] = (
                    prior_cost + costs[swatch, palette_index]
                )
                previous[swatch, palette_index] = prior_index
    selected = np.empty(swatch_count, dtype=int)
    selected[-1] = int(np.argmin(dynamic[-1]))
    for swatch in range(swatch_count - 1, 0, -1):
        selected[swatch - 1] = previous[swatch, selected[swatch]]
    return selected


def _swatch_lattice(
    band_lab: np.ndarray, cell_pitch: float
) -> tuple[float | None, float | None, float]:
    if band_lab.shape[0] < 2:
        return None, None, 0.0
    gradient = np.linalg.norm(np.diff(band_lab, axis=1), axis=2)
    projection = np.quantile(gradient, 0.25, axis=0)
    projection = cv2.GaussianBlur(projection.reshape(1, -1), (0, 0), 0.9).ravel()
    threshold = float(np.quantile(projection, 0.86))
    minimum_gap = max(3, int(round(0.55 * cell_pitch)))
    peaks: list[int] = []
    for index in range(2, len(projection) - 2):
        if projection[index] < threshold:
            continue
        if projection[index] != np.max(projection[index - 2 : index + 3]):
            continue
        if peaks and index - peaks[-1] < minimum_gap:
            if projection[index] > projection[peaks[-1]]:
                peaks[-1] = index
            continue
        peaks.append(index)
    differences = np.diff(peaks)
    # A legend slot has to contain a colour chip and its printed metadata, so
    # its repeat distance is distinctly larger than one board cell.  This is
    # only a lower size bound for rejecting glyph strokes; the actual arbitrary
    # slot pitch is still estimated from the image and is unrelated to any
    # every-N board-grid convention.
    plausible = differences[
        (differences >= 2.2 * cell_pitch) & (differences <= 12 * cell_pitch)
    ]
    if len(plausible) < 3:
        return None, None, 0.0
    cluster_radius = max(2.0, 0.10 * float(np.median(plausible)))
    centre = max(
        plausible,
        key=lambda value: int(
            np.count_nonzero(np.abs(plausible - value) <= cluster_radius)
        ),
    )
    cluster = plausible[np.abs(plausible - centre) <= cluster_radius]
    pitch = float(np.median(cluster))
    best = (-np.inf, 0.0)
    coordinates = np.arange(len(projection))
    scale = np.std(projection) + 1e-9
    for phase in np.linspace(0, pitch, 320, endpoint=False):
        positions = np.arange(phase, len(projection), pitch)
        score = float(np.mean(np.interp(positions, coordinates, projection)) / scale)
        if score > best[0]:
            best = (score, float(phase))
    return pitch, best[1], best[0]


def _dominant_rgb(patch: np.ndarray) -> np.ndarray:
    pixels = patch.reshape(-1, 3).astype(np.float64)
    quantized = np.floor_divide(pixels.astype(np.uint8), 6)
    keys, counts = np.unique(quantized, axis=0, return_counts=True)
    centre = (keys[int(np.argmax(counts))].astype(np.float64) + 0.5) * 6
    distances = np.linalg.norm(pixels - centre, axis=1)
    members = distances <= 18
    return (
        np.median(pixels[members], axis=0)
        if np.any(members)
        else np.median(pixels, axis=0)
    )


def _true_runs(mask: np.ndarray) -> list[tuple[int, int]]:
    padded = np.pad(mask.astype(np.int8), (1, 1))
    changes = np.diff(padded)
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return [(int(start), int(end)) for start, end in zip(starts, ends, strict=True)]
