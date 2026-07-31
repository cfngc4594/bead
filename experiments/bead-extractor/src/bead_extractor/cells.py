from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from .models import CellEstimate, GridGeometry, PaletteColor
from .palette import delta_e_ciede2000, rgb_to_lab


@dataclass(frozen=True, slots=True)
class CellExtractionConfig:
    # The fill is the largest compact color population in a cell. Grid strokes
    # and blurred code glyphs are separate, smaller populations. The radius is
    # deliberately measured in source RGB space so it also absorbs JPEG noise.
    cluster_radius_rgb: float = 16.0
    min_cluster_pixels: int = 3
    spatial_score_floor: float = 0.25
    axis_calibration_iterations: int = 4
    axis_calibration_max_delta_e: float = 7.0
    grid_cleanup_delta_e: float = 8.0
    grid_cleanup_axis_fraction: float = 0.10
    grid_cleanup_iterations: int = 3
    max_delta_e: float = 11.0
    min_margin: float = 0.55
    grid_line_halo: float = 0.55
    background_min_separation: float = 3.0
    background_max_separation: float = 28.0
    background_min_confidence: float = 0.55
    empty_cell_min_score: float = 0.68
    swatch_prototype_iterations: int = 4
    swatch_prototype_observation_weight: float = 0.55
    swatch_prototype_min_members: int = 4


@dataclass(slots=True)
class CellExtractionOutput:
    cells: list[CellEstimate]
    trusted_mask: np.ndarray
    calibrated_labs: np.ndarray
    color_offset_lab: np.ndarray
    axis_correction_lab: np.ndarray
    grid_cleanup_mask: np.ndarray
    uncertain_mask: np.ndarray
    grid_line_mask: np.ndarray
    empty_mask: np.ndarray
    empty_confidence: np.ndarray
    background_diagnostics: dict[str, object]


def restrict_cells_to_palette(
    output: CellExtractionOutput,
    palette: tuple[PaletteColor, ...],
    active_indexes: tuple[int, ...],
    config: CellExtractionConfig,
) -> None:
    """Reclassify cells against a swatch-derived active set, without smoothing."""
    if len(active_indexes) < 2:
        return
    indexes = np.asarray(active_indexes, dtype=int)
    active_labs = rgb_to_lab(
        np.asarray([palette[index].rgb for index in indexes], dtype=np.float64)
    )
    distances = delta_e_ciede2000(output.calibrated_labs, active_labs)
    order = np.argsort(distances, axis=1)
    local_best = order[:, 0]
    local_best, _, group_margins = _stabilize_repeated_colors(
        output.calibrated_labs, active_labs, local_best
    )
    best_distances = distances[np.arange(len(output.cells)), local_best]
    second_distances = np.partition(distances, 1, axis=1)[:, 1]
    uncertain = (~output.empty_mask.ravel()) & (
        (best_distances > config.max_delta_e) | (group_margins < config.min_margin)
    )
    output.uncertain_mask = uncertain.reshape(output.empty_mask.shape)
    for cell_index, cell in enumerate(output.cells):
        palette_index = indexes[local_best[cell_index]]
        color = palette[palette_index]
        cell.code = color.canonical_code
        cell.hex = color.hex
        cell.distance = float(best_distances[cell_index])
        cell.second_distance = float(second_distances[cell_index])


def classify_cells_from_swatches(
    output: CellExtractionOutput,
    palette: tuple[PaletteColor, ...],
    assigned_indexes: tuple[int, ...],
    prototype_labs: tuple[tuple[float, float, float], ...],
    config: CellExtractionConfig,
) -> None:
    """Classify against image-local swatches and robustly refine their colours.

    The table swatch is a small, compressed sample.  Each bead interior provides
    many more observations of the same export colour, so prototypes are nudged
    conservatively toward the median of their currently assigned cells.  The
    small fixed iteration count and minimum population keep adjacent colours
    from chasing individual noisy cells.
    """
    if len(assigned_indexes) < 2 or len(assigned_indexes) != len(prototype_labs):
        return
    prototypes = np.asarray(prototype_labs, dtype=np.float64)
    observed_labs = rgb_to_lab(
        np.asarray([cell.observed_rgb for cell in output.cells], dtype=np.float64)
    )
    nonempty = ~output.empty_mask.ravel()
    observation_weight = float(
        np.clip(config.swatch_prototype_observation_weight, 0.0, 0.8)
    )
    for _ in range(max(0, config.swatch_prototype_iterations)):
        distances = delta_e_ciede2000(observed_labs, prototypes)
        best = np.argmin(distances, axis=1)
        refined = prototypes.copy()
        for prototype_index in range(len(prototypes)):
            members = nonempty & (best == prototype_index)
            if np.count_nonzero(members) < config.swatch_prototype_min_members:
                continue
            cell_median = np.median(observed_labs[members], axis=0)
            refined[prototype_index] = (
                (1.0 - observation_weight) * prototypes[prototype_index]
                + observation_weight * cell_median
            )
        if np.max(np.abs(refined - prototypes)) < 1e-3:
            prototypes = refined
            break
        prototypes = refined

    distances = delta_e_ciede2000(observed_labs, prototypes)
    order = np.argsort(distances, axis=1)
    best = order[:, 0]
    best_distances = distances[np.arange(len(output.cells)), best]
    second_distances = np.partition(distances, 1, axis=1)[:, 1]
    margins = second_distances - best_distances
    uncertain = (~output.empty_mask.ravel()) & (
        (best_distances > config.max_delta_e) | (margins < config.min_margin)
    )
    output.uncertain_mask = uncertain.reshape(output.empty_mask.shape)
    for cell_index, cell in enumerate(output.cells):
        palette_index = assigned_indexes[best[cell_index]]
        color = palette[palette_index]
        cell.code = color.canonical_code
        cell.hex = color.hex
        cell.distance = float(best_distances[cell_index])
        cell.second_distance = float(second_distances[cell_index])


def extract_cells(
    image_rgb: np.ndarray,
    grid: GridGeometry,
    palette: tuple[PaletteColor, ...],
    config: CellExtractionConfig,
) -> CellExtractionOutput:
    trusted_mask = np.zeros(image_rgb.shape[:2], dtype=np.uint8)
    observed = np.empty((grid.rows * grid.cols, 3), dtype=np.float64)
    trusted_counts = np.empty(grid.rows * grid.cols, dtype=np.int32)

    x_edges = grid.column_edges()
    y_edges = grid.row_edges()
    x_line_widths = grid.column_line_widths()
    y_line_widths = grid.row_line_widths()
    grid_line_mask = _create_grid_line_mask(
        image_rgb.shape[:2],
        x_edges,
        y_edges,
        x_line_widths,
        y_line_widths,
        config.grid_line_halo,
    )
    for row in range(grid.rows):
        for col in range(grid.cols):
            index = row * grid.cols + col
            estimate, coordinates = _estimate_cell_color(
                image_rgb,
                x_edges[col],
                x_edges[col + 1],
                y_edges[row],
                y_edges[row + 1],
                config,
                left_line_width=x_line_widths[col],
                right_line_width=x_line_widths[col + 1],
                top_line_width=y_line_widths[row],
                bottom_line_width=y_line_widths[row + 1],
            )
            observed[index] = estimate
            trusted_counts[index] = len(coordinates)
            if len(coordinates):
                trusted_mask[coordinates[:, 0], coordinates[:, 1]] = 255

    empty_mask, empty_confidence, background_diagnostics = _detect_empty_cells(
        image_rgb,
        grid,
        x_line_widths,
        y_line_widths,
        config,
    )
    valid_color_cells = ~empty_mask.ravel()
    observed_labs = rgb_to_lab(observed)
    palette_rgb = np.asarray([color.rgb for color in palette], dtype=np.float64)
    palette_labs = rgb_to_lab(palette_rgb)
    color_offset = _estimate_color_offset(
        observed_labs[valid_color_cells], palette_labs
    )
    globally_calibrated = observed_labs + color_offset
    axis_correction = _estimate_axis_color_correction(
        globally_calibrated,
        palette_labs,
        grid.rows,
        grid.cols,
        config,
        valid_color_cells.reshape(grid.rows, grid.cols),
    )
    calibrated_labs = globally_calibrated + axis_correction
    distances = delta_e_ciede2000(calibrated_labs, palette_labs)
    order = np.argsort(distances, axis=1)
    initial_best = order[:, 0]
    best, _, group_margins = _stabilize_repeated_colors(
        calibrated_labs, palette_labs, initial_best
    )
    best, cleanup_mask = _remove_grid_label_leakage(
        best,
        palette_labs,
        grid.rows,
        grid.cols,
        config,
        valid_color_cells.reshape(grid.rows, grid.cols),
    )
    best_distances = distances[np.arange(len(observed)), best]
    second_distances = np.partition(distances, 1, axis=1)[:, 1]
    uncertain = valid_color_cells & (
        (best_distances > config.max_delta_e)
        | (group_margins < config.min_margin)
        | cleanup_mask.ravel()
    )

    cells = [
        CellEstimate(
            row=index // grid.cols,
            col=index % grid.cols,
            observed_rgb=observed[index],
            code=palette[best[index]].canonical_code,
            hex=palette[best[index]].hex,
            distance=float(best_distances[index]),
            second_distance=float(second_distances[index]),
            trusted_pixels=int(trusted_counts[index]),
            is_empty=bool(empty_mask.ravel()[index]),
            empty_confidence=float(empty_confidence.ravel()[index]),
        )
        for index in range(len(observed))
    ]
    return CellExtractionOutput(
        cells=cells,
        trusted_mask=trusted_mask,
        calibrated_labs=calibrated_labs,
        color_offset_lab=color_offset,
        axis_correction_lab=axis_correction.reshape(grid.rows, grid.cols, 3),
        grid_cleanup_mask=cleanup_mask,
        uncertain_mask=uncertain.reshape(grid.rows, grid.cols),
        grid_line_mask=grid_line_mask,
        empty_mask=empty_mask,
        empty_confidence=empty_confidence,
        background_diagnostics=background_diagnostics,
    )


def _estimate_cell_color(
    image_rgb: np.ndarray,
    left: float,
    right: float,
    top: float,
    bottom: float,
    config: CellExtractionConfig,
    *,
    left_line_width: float = 0.0,
    right_line_width: float = 0.0,
    top_line_width: float = 0.0,
    bottom_line_width: float = 0.0,
) -> tuple[np.ndarray, np.ndarray]:
    height, width = image_rgb.shape[:2]
    # Assign by pixel centre, not by overlapping floor/ceil rectangles. With
    # the old bounds, both cells adjacent to an edge consumed the same source
    # row/column. A thick coarse divider could therefore become a two-cell-wide
    # color stripe in the reconstruction.
    maximum_x_inset = 0.30 * (right - left)
    maximum_y_inset = 0.30 * (bottom - top)
    left_inset = (
        min(maximum_x_inset, left_line_width / 2 + config.grid_line_halo)
        if left_line_width > 0
        else 0.0
    )
    right_inset = (
        min(maximum_x_inset, right_line_width / 2 + config.grid_line_halo)
        if right_line_width > 0
        else 0.0
    )
    top_inset = (
        min(maximum_y_inset, top_line_width / 2 + config.grid_line_halo)
        if top_line_width > 0
        else 0.0
    )
    bottom_inset = (
        min(maximum_y_inset, bottom_line_width / 2 + config.grid_line_halo)
        if bottom_line_width > 0
        else 0.0
    )
    x0 = max(0, int(np.ceil(left + left_inset - 0.5)))
    x1 = min(width, int(np.ceil(right - right_inset - 0.5)))
    y0 = max(0, int(np.ceil(top + top_inset - 0.5)))
    y1 = min(height, int(np.ceil(bottom - bottom_inset - 0.5)))
    if x1 <= x0 or y1 <= y0:
        return np.zeros(3, dtype=np.float64), np.empty((0, 2), dtype=int)

    yy, xx = np.mgrid[y0:y1, x0:x1]
    pixels = image_rgb[y0:y1, x0:x1].reshape(-1, 3).astype(np.float64)
    all_coordinates = np.column_stack((yy.ravel(), xx.ravel()))
    pairwise = np.linalg.norm(pixels[:, None, :] - pixels[None, :, :], axis=2)
    neighborhoods = pairwise <= config.cluster_radius_rgb
    support = np.sum(neighborhoods, axis=1)
    local_y = all_coordinates[:, 0] - y0
    local_x = all_coordinates[:, 1] - x0
    scores = np.empty(len(pixels), dtype=np.float64)
    for index, members in enumerate(neighborhoods):
        span_x = (np.ptp(local_x[members]) + 1) / max(x1 - x0, 1)
        span_y = (np.ptp(local_y[members]) + 1) / max(y1 - y0, 1)
        spatial_coverage = np.sqrt(span_x * span_y)
        scores[index] = support[index] * (
            config.spatial_score_floor
            + (1 - config.spatial_score_floor) * spatial_coverage
        )
    largest = float(np.max(scores))
    centers = np.flatnonzero(np.isclose(scores, largest))
    if len(centers) > 1:
        compactness = np.asarray(
            [np.mean(pairwise[index, neighborhoods[index]]) for index in centers]
        )
        center = int(centers[int(np.argmin(compactness))])
    else:
        center = int(centers[0])
    members = neighborhoods[center]
    if np.count_nonzero(members) < config.min_cluster_pixels:
        nearest = np.argsort(pairwise[center])[: config.min_cluster_pixels]
        members = np.zeros(len(pixels), dtype=bool)
        members[nearest] = True
    return np.mean(pixels[members], axis=0), all_coordinates[members]


def _create_grid_line_mask(
    image_shape: tuple[int, int],
    x_edges: np.ndarray,
    y_edges: np.ndarray,
    x_widths: np.ndarray,
    y_widths: np.ndarray,
    halo: float,
) -> np.ndarray:
    height, width = image_shape
    mask = np.zeros((height, width), dtype=np.uint8)
    top = max(0, int(np.floor(y_edges[0])))
    bottom = min(height - 1, int(np.ceil(y_edges[-1])))
    left = max(0, int(np.floor(x_edges[0])))
    right = min(width - 1, int(np.ceil(x_edges[-1])))
    for centre, line_width in zip(x_edges, x_widths, strict=True):
        half = line_width / 2 + halo
        x0 = max(0, int(np.floor(centre - half)))
        x1 = min(width - 1, int(np.ceil(centre + half)))
        cv2.rectangle(mask, (x0, top), (x1, bottom), 255, -1)
    for centre, line_width in zip(y_edges, y_widths, strict=True):
        half = line_width / 2 + halo
        y0 = max(0, int(np.floor(centre - half)))
        y1 = min(height - 1, int(np.ceil(centre + half)))
        cv2.rectangle(mask, (left, y0), (right, y1), 255, -1)
    return mask


def _cell_interior_bounds(
    grid: GridGeometry,
    row: int,
    col: int,
    x_widths: np.ndarray,
    y_widths: np.ndarray,
    image_shape: tuple[int, int],
    halo: float,
) -> tuple[int, int, int, int]:
    x_edges = grid.column_edges()
    y_edges = grid.row_edges()
    cell_width = x_edges[col + 1] - x_edges[col]
    cell_height = y_edges[row + 1] - y_edges[row]
    left_inset = min(0.30 * cell_width, x_widths[col] / 2 + halo)
    right_inset = min(0.30 * cell_width, x_widths[col + 1] / 2 + halo)
    top_inset = min(0.30 * cell_height, y_widths[row] / 2 + halo)
    bottom_inset = min(0.30 * cell_height, y_widths[row + 1] / 2 + halo)
    height, width = image_shape
    x0 = max(0, int(np.ceil(x_edges[col] + left_inset - 0.5)))
    x1 = min(width, int(np.ceil(x_edges[col + 1] - right_inset - 0.5)))
    y0 = max(0, int(np.ceil(y_edges[row] + top_inset - 0.5)))
    y1 = min(height, int(np.ceil(y_edges[row + 1] - bottom_inset - 0.5)))
    return x0, x1, y0, y1


def _detect_empty_cells(
    image_rgb: np.ndarray,
    grid: GridGeometry,
    x_widths: np.ndarray,
    y_widths: np.ndarray,
    config: CellExtractionConfig,
) -> tuple[np.ndarray, np.ndarray, dict[str, object]]:
    """Learn a repeated two-tone transparent background from perimeter cells.

    The detector never assigns a fixed RGB value to emptiness.  It requires two
    bright achromatic modes, both modes distributed within many perimeter cells,
    and then scores every cell against those learned modes.  A flat white bead
    therefore does not become empty merely because it is light.
    """
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB).astype(np.float64)
    perimeter = {
        *(0 * grid.cols + col for col in range(grid.cols)),
        *((grid.rows - 1) * grid.cols + col for col in range(grid.cols)),
        *(row * grid.cols for row in range(grid.rows)),
        *(row * grid.cols + grid.cols - 1 for row in range(grid.rows)),
    }
    perimeter_pixels: list[np.ndarray] = []
    for index in sorted(perimeter):
        row, col = divmod(index, grid.cols)
        x0, x1, y0, y1 = _cell_interior_bounds(
            grid,
            row,
            col,
            x_widths,
            y_widths,
            image_rgb.shape[:2],
            config.grid_line_halo,
        )
        patch = lab[y0:y1, x0:x1]
        if patch.size:
            perimeter_pixels.append(patch.reshape(-1, 3))
    if not perimeter_pixels:
        shape = (grid.rows, grid.cols)
        return (
            np.zeros(shape, dtype=bool),
            np.zeros(shape, dtype=np.float64),
            {"enabled": False, "reason": "no-perimeter-pixels"},
        )

    pixels = np.concatenate(perimeter_pixels)
    chroma = np.linalg.norm(pixels[:, 1:] - 128, axis=1)
    eligible = pixels[(pixels[:, 0] >= 185) & (chroma <= 18), 0]
    minimum_support = max(30, len(pixels) // 12)
    if len(eligible) < minimum_support:
        shape = (grid.rows, grid.cols)
        return (
            np.zeros(shape, dtype=bool),
            np.zeros(shape, dtype=np.float64),
            {
                "enabled": False,
                "reason": "insufficient-bright-achromatic-support",
                "eligiblePixels": int(len(eligible)),
            },
        )

    centres = np.quantile(eligible, [0.25, 0.75]).astype(np.float64)
    for _ in range(12):
        labels = np.argmin(np.abs(eligible[:, None] - centres[None, :]), axis=1)
        next_centres = centres.copy()
        for label in range(2):
            members = eligible[labels == label]
            if len(members):
                next_centres[label] = np.median(members)
        if np.allclose(next_centres, centres):
            break
        centres = next_centres
    centres.sort()
    separation = float(centres[1] - centres[0])
    labels = np.argmin(np.abs(eligible[:, None] - centres[None, :]), axis=1)
    weights = np.bincount(labels, minlength=2) / len(labels)
    mode_balance = float(np.min(weights))
    separation_component = float(
        np.clip(
            (separation - config.background_min_separation)
            / max(
                config.background_max_separation - config.background_min_separation,
                1e-9,
            ),
            0,
            1,
        )
    )
    balance_component = float(np.clip((mode_balance - 0.15) / 0.25, 0, 1))

    tolerance = max(2.5, min(6.0, 0.45 * separation))
    cell_scores = np.zeros((grid.rows, grid.cols), dtype=np.float64)
    mode_fractions = np.zeros((grid.rows, grid.cols, 2), dtype=np.float64)
    for row in range(grid.rows):
        for col in range(grid.cols):
            x0, x1, y0, y1 = _cell_interior_bounds(
                grid,
                row,
                col,
                x_widths,
                y_widths,
                image_rgb.shape[:2],
                config.grid_line_halo,
            )
            patch = lab[y0:y1, x0:x1]
            if patch.size == 0:
                continue
            patch_chroma = np.linalg.norm(patch[..., 1:] - 128, axis=2)
            distances = np.abs(patch[..., 0, None] - centres[None, None, :])
            modes = np.argmin(distances, axis=2)
            near = (np.min(distances, axis=2) <= tolerance) & (patch_chroma <= 18)
            fractions = np.asarray(
                [np.mean(near & (modes == mode)) for mode in range(2)]
            )
            mode_fractions[row, col] = fractions
            total = float(np.sum(fractions))
            total_component = float(np.clip((total - 0.52) / 0.38, 0, 1))
            local_balance = float(np.clip(np.min(fractions) / 0.18, 0, 1))
            quadrant_presence = []
            patch_height, patch_width = near.shape
            for mode in range(2):
                present = 0
                for qy in range(2):
                    for qx in range(2):
                        ys = slice(qy * patch_height // 2, (qy + 1) * patch_height // 2)
                        xs = slice(qx * patch_width // 2, (qx + 1) * patch_width // 2)
                        quadrant = near[ys, xs] & (modes[ys, xs] == mode)
                        present += int(np.any(quadrant))
                quadrant_presence.append(present / 4)
            coverage = min(quadrant_presence)
            cell_scores[row, col] = (
                0.50 * total_component + 0.30 * local_balance + 0.20 * coverage
            )

    perimeter_scores = cell_scores.ravel()[np.asarray(sorted(perimeter))]
    repeated_fraction = float(np.mean(perimeter_scores >= config.empty_cell_min_score))
    repeat_component = float(np.clip((repeated_fraction - 0.20) / 0.55, 0, 1))
    confidence = float(
        np.clip(
            0.30 * separation_component
            + 0.30 * balance_component
            + 0.40 * repeat_component,
            0,
            1,
        )
    )
    enabled = bool(
        config.background_min_separation
        <= separation
        <= config.background_max_separation
        and confidence >= config.background_min_confidence
    )
    empty_mask = (
        (cell_scores >= config.empty_cell_min_score)
        if enabled
        else np.zeros_like(cell_scores, dtype=bool)
    )
    diagnostics: dict[str, object] = {
        "enabled": enabled,
        "confidence": confidence,
        "lightnessModes": centres.tolist(),
        "modeWeights": weights.tolist(),
        "modeSeparation": separation,
        "perimeterRepeatedFraction": repeated_fraction,
        "emptyCells": int(np.count_nonzero(empty_mask)),
    }
    if not enabled:
        diagnostics["reason"] = "no-stable-repeated-two-tone-background"
    return empty_mask, cell_scores, diagnostics


def _estimate_axis_color_correction(
    observed_labs: np.ndarray,
    palette_labs: np.ndarray,
    rows: int,
    cols: int,
    config: CellExtractionConfig,
    valid_mask: np.ndarray | None = None,
) -> np.ndarray:
    base = observed_labs.reshape(rows, cols, 3)
    correction = np.zeros_like(base)
    minimum_row_support = max(10, int(np.ceil(cols * 0.10)))
    minimum_col_support = max(10, int(np.ceil(rows * 0.10)))
    for _ in range(config.axis_calibration_iterations):
        calibrated = base + correction
        distances = delta_e_ciede2000(calibrated.reshape(-1, 3), palette_labs)
        distances = distances.reshape(rows, cols, -1)
        best = np.argmin(distances, axis=2)
        residual = palette_labs[best] - calibrated
        confident = np.min(distances, axis=2) < config.axis_calibration_max_delta_e
        if valid_mask is not None:
            confident &= valid_mask
        row_effect = np.zeros((rows, 3), dtype=np.float64)
        col_effect = np.zeros((cols, 3), dtype=np.float64)
        for row in range(rows):
            values = residual[row][confident[row]]
            if len(values) >= minimum_row_support:
                row_effect[row] = np.median(values, axis=0)
        for col in range(cols):
            values = residual[:, col][confident[:, col]]
            if len(values) >= minimum_col_support:
                col_effect[col] = np.median(values, axis=0)
        row_effect = np.clip(row_effect, [-1.5, -2.0, -2.0], [1.5, 2.0, 2.0])
        col_effect = np.clip(col_effect, [-1.5, -2.0, -2.0], [1.5, 2.0, 2.0])
        target = row_effect[:, None, :] + col_effect[None, :, :]
        correction = 0.6 * correction + 0.4 * target
    return correction.reshape(-1, 3)


def _remove_grid_label_leakage(
    labels: np.ndarray,
    palette_labs: np.ndarray,
    rows: int,
    cols: int,
    config: CellExtractionConfig,
    valid_mask: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    matrix = labels.reshape(rows, cols).copy()
    changed = np.zeros((rows, cols), dtype=bool)
    palette_distances = delta_e_ciede2000(palette_labs, palette_labs)
    minimum_row = max(3, int(np.ceil(cols * config.grid_cleanup_axis_fraction)))
    minimum_col = max(3, int(np.ceil(rows * config.grid_cleanup_axis_fraction)))

    for _ in range(config.grid_cleanup_iterations):
        row_counts = np.zeros(rows, dtype=int)
        col_counts = np.zeros(cols, dtype=int)
        for row in range(1, rows - 1):
            row_counts[row] = int(
                np.count_nonzero(
                    (matrix[row - 1] == matrix[row + 1])
                    & (matrix[row] != matrix[row - 1])
                )
            )
        for col in range(1, cols - 1):
            col_counts[col] = int(
                np.count_nonzero(
                    (matrix[:, col - 1] == matrix[:, col + 1])
                    & (matrix[:, col] != matrix[:, col - 1])
                )
            )

        next_matrix = matrix.copy()
        for row in np.flatnonzero(row_counts >= minimum_row):
            neighbor = matrix[row - 1]
            candidate = (neighbor == matrix[row + 1]) & (matrix[row] != neighbor)
            if valid_mask is not None:
                candidate &= valid_mask[row]
            indexes = np.flatnonzero(candidate)
            close = (
                palette_distances[matrix[row, indexes], neighbor[indexes]]
                < config.grid_cleanup_delta_e
            )
            selected = indexes[close]
            next_matrix[row, selected] = neighbor[selected]
            changed[row, selected] = True
        for col in np.flatnonzero(col_counts >= minimum_col):
            neighbor = matrix[:, col - 1]
            candidate = (neighbor == matrix[:, col + 1]) & (matrix[:, col] != neighbor)
            if valid_mask is not None:
                candidate &= valid_mask[:, col]
            indexes = np.flatnonzero(candidate)
            close = (
                palette_distances[matrix[indexes, col], neighbor[indexes]]
                < config.grid_cleanup_delta_e
            )
            selected = indexes[close]
            next_matrix[selected, col] = neighbor[selected]
            changed[selected, col] = True
        if np.array_equal(next_matrix, matrix):
            break
        matrix = next_matrix
    return matrix.ravel(), changed


def _estimate_color_offset(
    observed_labs: np.ndarray, palette_labs: np.ndarray
) -> np.ndarray:
    offset = np.zeros(3, dtype=np.float64)
    if len(observed_labs) == 0:
        return offset
    for _ in range(3):
        calibrated = observed_labs + offset
        distances = delta_e_ciede2000(calibrated, palette_labs)
        order = np.argsort(distances, axis=1)
        best = order[:, 0]
        margins = (
            distances[np.arange(len(distances)), order[:, 1]]
            - distances[np.arange(len(distances)), best]
        )
        minimum = distances[np.arange(len(distances)), best]
        selected = (minimum < 7.0) & (margins > 0.8)
        if np.count_nonzero(selected) < 10:
            break
        per_code: list[np.ndarray] = []
        for code_index in np.unique(best[selected]):
            members = selected & (best == code_index)
            if np.count_nonzero(members):
                per_code.append(
                    np.median(palette_labs[code_index] - calibrated[members], axis=0)
                )
        if not per_code:
            break
        step = np.median(np.stack(per_code), axis=0)
        step = np.clip(step, [-2.0, -2.5, -2.5], [2.0, 2.5, 2.5])
        offset += step
        if np.linalg.norm(step) < 0.05:
            break
    return offset


def _stabilize_repeated_colors(
    observed_labs: np.ndarray,
    palette_labs: np.ndarray,
    initial_labels: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Pool repeated colors so JPEG noise cannot split every cell independently."""
    labels = initial_labels.copy()
    for _ in range(4):
        mapping: dict[int, int] = {}
        for label in np.unique(labels):
            members = labels == label
            if np.count_nonzero(members) < 2:
                mapping[int(label)] = int(label)
                continue
            centroid = np.median(observed_labs[members], axis=0)
            centroid_distances = delta_e_ciede2000(centroid[None, :], palette_labs)[0]
            mapping[int(label)] = int(np.argmin(centroid_distances))
        next_labels = np.asarray([mapping[int(label)] for label in labels], dtype=int)
        if np.array_equal(next_labels, labels):
            break
        labels = next_labels

    group_distances = np.empty(len(labels), dtype=np.float64)
    group_margins = np.empty(len(labels), dtype=np.float64)
    for label in np.unique(labels):
        members = labels == label
        centroid = np.median(observed_labs[members], axis=0)
        centroid_distances = delta_e_ciede2000(centroid[None, :], palette_labs)[0]
        ordered = np.sort(centroid_distances)
        group_distances[members] = centroid_distances[label]
        group_margins[members] = ordered[1] - ordered[0]
    return labels, group_distances, group_margins
