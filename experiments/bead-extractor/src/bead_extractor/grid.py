from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from .errors import ExtractionError
from .models import GridGeometry


@dataclass(frozen=True, slots=True)
class GridDetectionConfig:
    min_pitch: float = 5.0
    max_pitch: float = 40.0
    max_rows: int = 300
    max_cols: int = 300
    max_cells: int = 90_000
    min_confidence: float = 0.48
    continuity_quantile: float = 0.20
    caliper_count: int = 24
    caliper_search_fraction: float = 0.30
    grid_halo: float = 0.55
    detect_coordinate_frame: bool = True


@dataclass(frozen=True, slots=True)
class _PitchEstimate:
    pitch: float
    autocorrelation_peak: float
    score: float


@dataclass(frozen=True, slots=True)
class _AxisMeasurements:
    edges: np.ndarray
    widths: np.ndarray
    confidences: np.ndarray
    coverages: np.ndarray
    pitch: float
    phase: float
    phase_score: float
    fit_residual: float
    interpolated_count: int


@dataclass(frozen=True, slots=True)
class _Extent:
    start: float
    end: float
    confidence: float
    alternative_margin: float


def detect_grid(image_rgb: np.ndarray, config: GridDetectionConfig) -> GridGeometry:
    """Detect an axis-aligned grid without assuming a coarse-line cadence.

    Autocorrelation proposes only the one-cell pitch.  A low-quantile projection
    then favours strokes that continue across the board over repeated glyph
    strokes.  Finally, independent one-dimensional calipers measure every line;
    their centres share an approximately equal lattice while their widths remain
    completely independent.
    """
    if image_rgb.ndim != 3 or image_rgb.shape[2] != 3:
        raise ExtractionError("INVALID_IMAGE", "Expected an RGB image")

    height, width = image_rgb.shape[:2]
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    gradient_x = _color_difference(lab, direction="x")
    gradient_y = _color_difference(lab, direction="y")

    pitch_x_initial = _estimate_pitch(_robust_projection(gradient_x, axis=0), config)
    pitch_y_initial = _estimate_pitch(_robust_projection(gradient_y, axis=1), config)

    continuous_x = _continuous_projection(
        gradient_x, axis=0, quantile=config.continuity_quantile
    )
    continuous_y = _continuous_projection(
        gradient_y, axis=1, quantile=config.continuity_quantile
    )
    pitch_x, phase_x, phase_score_x = _refine_pitch_and_phase(
        continuous_x, pitch_x_initial.pitch, config
    )
    pitch_y, phase_y, phase_score_y = _refine_pitch_and_phase(
        continuous_y, pitch_y_initial.pitch, config
    )

    # If one projection locks to a harmonic, prefer the smaller period.  This is
    # cadence-free: all integer multiples are considered equally, and no line is
    # assigned a special 5/10-grid role.
    smaller = min(pitch_x, pitch_y)
    larger = max(pitch_x, pitch_y)
    ratio = larger / max(smaller, 1e-9)
    harmonic = int(round(ratio))
    harmonic_adjusted = False
    if harmonic >= 2 and abs(ratio - harmonic) < 0.08:
        harmonic_adjusted = True
        if pitch_x > pitch_y:
            pitch_x, phase_x, phase_score_x = _refine_pitch_and_phase(
                continuous_x, smaller, config
            )
        else:
            pitch_y, phase_y, phase_score_y = _refine_pitch_and_phase(
                continuous_y, smaller, config
            )

    relative_pitch_difference = abs(pitch_x - pitch_y) / max(pitch_x, pitch_y)
    if relative_pitch_difference <= 0.03:
        weights = np.maximum([phase_score_x, phase_score_y], 0.05)
        shared_pitch = float(np.average([pitch_x, pitch_y], weights=weights))
        pitch_x = shared_pitch
        pitch_y = shared_pitch
        phase_x, phase_score_x = _refine_phase(continuous_x, shared_pitch)
        phase_y, phase_score_y = _refine_phase(continuous_y, shared_pitch)

    x_candidates = _lattice_positions(width, pitch_x, phase_x)
    y_support = _orthogonal_comb_support(gradient_x, x_candidates, direction="x")
    y_extent = _find_extent(y_support, pitch_y)
    y_start, y_end = _snap_extent_to_lattice(y_extent, height, pitch_y, phase_y)

    y_candidates = _positions_between(height, pitch_y, phase_y, y_start, y_end)
    x_support = _orthogonal_comb_support(gradient_y, y_candidates, direction="y")
    x_extent = _find_extent(x_support, pitch_x)
    x_start, x_end = _snap_extent_to_lattice(x_extent, width, pitch_x, phase_x)

    # Re-evaluate the vertical extent using only the horizontal range selected by
    # the first pass.  This prevents a title or a legend from extending the board.
    x_candidates = _positions_between(width, pitch_x, phase_x, x_start, x_end)
    y_support = _orthogonal_comb_support(gradient_x, x_candidates, direction="x")
    y_extent = _find_extent(y_support, pitch_y)
    y_start, y_end = _snap_extent_to_lattice(y_extent, height, pitch_y, phase_y)

    x_axis = _measure_axis(
        gradient_x,
        direction="x",
        pitch=pitch_x,
        phase=phase_x,
        start=x_start,
        end=x_end,
        orthogonal_interval=(y_start, y_end),
        phase_score=phase_score_x,
        config=config,
    )
    y_axis = _measure_axis(
        gradient_y,
        direction="y",
        pitch=pitch_y,
        phase=phase_y,
        start=y_start,
        end=y_end,
        orthogonal_interval=(x_start, x_end),
        phase_score=phase_score_y,
        config=config,
    )

    full_rows = len(y_axis.edges) - 1
    full_cols = len(x_axis.edges) - 1
    if full_rows < 2 or full_cols < 2:
        raise ExtractionError(
            "GRID_NOT_FOUND",
            "The detected lattice is too small to form a grid",
            {"rows": full_rows, "cols": full_cols},
        )

    frame_confidence = _coordinate_frame_confidence(
        image_rgb, x_axis.edges, y_axis.edges
    )
    frame_detected = bool(
        config.detect_coordinate_frame
        and frame_confidence >= 0.48
        and full_rows >= 4
        and full_cols >= 4
    )
    trim = slice(1, -1) if frame_detected else slice(None)
    x_edges = x_axis.edges[trim]
    y_edges = y_axis.edges[trim]
    x_widths = x_axis.widths[trim]
    y_widths = y_axis.widths[trim]
    x_confidences = x_axis.confidences[trim]
    y_confidences = y_axis.confidences[trim]
    if frame_detected:
        x_edges[0] = x_axis.edges[0] + x_axis.pitch
        x_edges[-1] = x_axis.edges[-1] - x_axis.pitch
        y_edges[0] = y_axis.edges[0] + y_axis.pitch
        y_edges[-1] = y_axis.edges[-1] - y_axis.pitch
    rows = len(y_edges) - 1
    cols = len(x_edges) - 1

    pitch_agreement = float(
        np.clip(
            1 - abs(x_axis.pitch - y_axis.pitch) / max(x_axis.pitch, y_axis.pitch), 0, 1
        )
    )
    line_coverage = float(
        np.sqrt(np.mean(x_axis.coverages) * np.mean(y_axis.coverages))
    )
    residual_score = float(
        np.exp(
            -(
                x_axis.fit_residual / max(x_axis.pitch, 1e-9)
                + y_axis.fit_residual / max(y_axis.pitch, 1e-9)
            )
        )
    )
    phase_component = float(np.clip((phase_score_x + phase_score_y) / 3.0, 0, 1))
    extent_confidence = float(np.sqrt(x_extent.confidence * y_extent.confidence))
    confidence = float(
        np.clip(
            0.22 * pitch_agreement
            + 0.22 * phase_component
            + 0.24 * line_coverage
            + 0.20 * extent_confidence
            + 0.12 * residual_score,
            0,
            1,
        )
    )

    diagnostics = {
        "method": "multi-caliper-equal-center-lattice",
        "edgeModel": "per-line-width-axis-aligned",
        "lineWidthDefinition": "full-effective-gradient-support",
        "autocorrelationPeakX": pitch_x_initial.autocorrelation_peak,
        "autocorrelationPeakY": pitch_y_initial.autocorrelation_peak,
        "pitchProposalScoreX": pitch_x_initial.score,
        "pitchProposalScoreY": pitch_y_initial.score,
        "phaseScoreX": phase_score_x,
        "phaseScoreY": phase_score_y,
        "pitchAgreement": pitch_agreement,
        "harmonicAdjusted": harmonic_adjusted,
        "extentConfidenceX": x_extent.confidence,
        "extentConfidenceY": y_extent.confidence,
        "extentAlternativeMarginX": x_extent.alternative_margin,
        "extentAlternativeMarginY": y_extent.alternative_margin,
        "lineCoverageX": float(np.mean(x_axis.coverages)),
        "lineCoverageY": float(np.mean(y_axis.coverages)),
        "fitResidualX": x_axis.fit_residual,
        "fitResidualY": y_axis.fit_residual,
        "interpolatedLinesX": x_axis.interpolated_count,
        "interpolatedLinesY": y_axis.interpolated_count,
        "coordinateFrameDetected": frame_detected,
        "coordinateFrameConfidence": frame_confidence,
        "fullGridRows": full_rows,
        "fullGridCols": full_cols,
        "lineCentersX": x_edges.tolist(),
        "lineCentersY": y_edges.tolist(),
        "lineWidthsX": x_widths.tolist(),
        "lineWidthsY": y_widths.tolist(),
        "lineConfidencesX": x_confidences.tolist(),
        "lineConfidencesY": y_confidences.tolist(),
    }
    return GridGeometry(
        left=float(x_edges[0]),
        top=float(y_edges[0]),
        right=float(x_edges[-1]),
        bottom=float(y_edges[-1]),
        rows=rows,
        cols=cols,
        pitch_x=float(np.median(np.diff(x_edges))),
        pitch_y=float(np.median(np.diff(y_edges))),
        confidence=confidence,
        diagnostics=diagnostics,
        x_edges=tuple(float(value) for value in x_edges),
        y_edges=tuple(float(value) for value in y_edges),
        x_line_widths=tuple(float(value) for value in x_widths),
        y_line_widths=tuple(float(value) for value in y_widths),
        x_line_confidences=tuple(float(value) for value in x_confidences),
        y_line_confidences=tuple(float(value) for value in y_confidences),
    )


def _color_difference(lab: np.ndarray, direction: str) -> np.ndarray:
    if direction == "x":
        difference = np.linalg.norm(np.diff(lab, axis=1), axis=2)
        return np.pad(difference, ((0, 0), (0, 1)), mode="constant")
    difference = np.linalg.norm(np.diff(lab, axis=0), axis=2)
    return np.pad(difference, ((0, 1), (0, 0)), mode="constant")


def _robust_projection(gradient: np.ndarray, axis: int) -> np.ndarray:
    cap = np.quantile(gradient, 0.88, axis=axis, keepdims=True)
    projection = np.mean(np.minimum(gradient, cap), axis=axis).astype(np.float64)
    baseline = cv2.GaussianBlur(projection.reshape(1, -1), (0, 0), 9).ravel()
    return projection - baseline


def _continuous_projection(
    gradient: np.ndarray, axis: int, quantile: float
) -> np.ndarray:
    projection = np.quantile(gradient, quantile, axis=axis).astype(np.float64)
    return cv2.GaussianBlur(projection.reshape(1, -1), (0, 0), 0.55).ravel()


def _normalized_autocorrelation(signal: np.ndarray, max_lag: int) -> np.ndarray:
    signal = signal - np.mean(signal)
    result = np.zeros(max_lag + 1, dtype=np.float64)
    result[0] = 1.0
    for lag in range(1, max_lag + 1):
        left = signal[:-lag]
        right = signal[lag:]
        denominator = np.sqrt(np.dot(left, left) * np.dot(right, right))
        result[lag] = np.dot(left, right) / denominator if denominator else 0.0
    return result


def _estimate_pitch(
    projection: np.ndarray, config: GridDetectionConfig
) -> _PitchEstimate:
    minimum = max(2, int(np.floor(config.min_pitch)))
    maximum = min(int(np.ceil(config.max_pitch)), len(projection) // 3)
    max_lag = min(maximum * 8, len(projection) // 2)
    autocorrelation = _normalized_autocorrelation(projection, max_lag)
    candidates: list[tuple[float, int]] = []
    for lag in range(minimum, maximum + 1):
        values = []
        weights = []
        for multiple in range(1, min(8, max_lag // lag) + 1):
            values.append(autocorrelation[lag * multiple])
            weights.append(1 / np.sqrt(multiple))
        # A fundamental should recur at many integer multiples.  No particular
        # multiple is privileged, so arbitrary thick-line patterns are allowed.
        score = float(np.average(values, weights=weights))
        candidates.append((score, lag))
    if not candidates:
        raise ExtractionError("GRID_NOT_FOUND", "No pitch candidates are possible")
    best_score = max(score for score, _ in candidates)
    # Prefer the smallest period that explains essentially the same repeated
    # evidence.  Wider character strokes and arbitrary thick dividers often
    # create stronger harmonics than the one-cell lattice.
    eligible = [
        (score, lag)
        for score, lag in candidates
        if score >= 0.85 * best_score and autocorrelation[lag] > 0.08
    ]
    score, lag = (
        min(eligible, key=lambda item: item[1]) if eligible else max(candidates)
    )
    if score < 0.035:
        raise ExtractionError(
            "GRID_NOT_FOUND",
            "No repeating one-cell lattice period was found",
            {"autocorrelationScore": score},
        )
    return _PitchEstimate(float(lag), float(autocorrelation[lag]), score)


def _comb_score(signal: np.ndarray, pitch: float, phase: float) -> float:
    positions = np.arange(phase, len(signal), pitch)
    if len(positions) < 6:
        return -np.inf
    coordinates = np.arange(len(signal), dtype=np.float64)
    on_line = np.interp(positions, coordinates, signal)
    scale = np.std(signal) + 1e-9
    return float(np.mean(on_line) / scale)


def _refine_pitch_and_phase(
    projection: np.ndarray,
    initial_pitch: float,
    config: GridDetectionConfig,
) -> tuple[float, float, float]:
    radius = max(0.75, initial_pitch * 0.07)
    low = max(config.min_pitch, initial_pitch - radius)
    high = min(config.max_pitch, initial_pitch + radius)
    pitch_candidates = np.linspace(low, high, 101)
    best = (-np.inf, initial_pitch, 0.0)
    for pitch in pitch_candidates:
        for phase in np.linspace(0, pitch, 48, endpoint=False):
            score = _comb_score(projection, float(pitch), float(phase))
            if score > best[0]:
                best = (score, float(pitch), float(phase))

    pitch = best[1]
    phase_low = best[2] - pitch / 24
    for phase in np.linspace(phase_low, phase_low + pitch / 12, 81):
        normalized_phase = float(phase % pitch)
        score = _comb_score(projection, pitch, normalized_phase)
        if score > best[0]:
            best = (score, pitch, normalized_phase)
    return best[1], best[2], best[0]


def _refine_phase(signal: np.ndarray, pitch: float) -> tuple[float, float]:
    best = (-np.inf, 0.0)
    for phase in np.linspace(0, pitch, 480, endpoint=False):
        score = _comb_score(signal, pitch, float(phase))
        if score > best[0]:
            best = (score, float(phase))
    return best[1], best[0]


def _lattice_positions(length: int, pitch: float, phase: float) -> np.ndarray:
    minimum_index = int(np.floor((-0.60 * pitch - phase) / pitch))
    maximum_index = int(np.ceil((length + 0.60 * pitch - phase) / pitch))
    positions = phase + np.arange(minimum_index, maximum_index + 1) * pitch
    return positions[
        (positions >= -0.60 * pitch) & (positions <= length + 0.60 * pitch)
    ]


def _positions_between(
    length: int,
    pitch: float,
    phase: float,
    start: float,
    end: float,
) -> np.ndarray:
    positions = _lattice_positions(length, pitch, phase)
    tolerance = 0.55 * pitch
    selected = positions[
        (positions >= start - tolerance) & (positions <= end + tolerance)
    ]
    if len(selected) < 3:
        return positions
    return selected


def _orthogonal_comb_support(
    gradient: np.ndarray, positions: np.ndarray, direction: str
) -> np.ndarray:
    offsets = (-0.8, 0.0, 0.8)
    if direction == "x":
        valid = positions[(positions >= 0) & (positions <= gradient.shape[1] - 1)]
        coordinates = np.arange(gradient.shape[1], dtype=np.float64)
        samples = np.stack(
            [
                np.stack(
                    [np.interp(valid + offset, coordinates, row) for row in gradient]
                )
                for offset in offsets
            ]
        )
    else:
        valid = positions[(positions >= 0) & (positions <= gradient.shape[0] - 1)]
        coordinates = np.arange(gradient.shape[0], dtype=np.float64)
        samples = np.stack(
            [
                np.stack(
                    [
                        np.interp(valid + offset, coordinates, column)
                        for column in gradient.T
                    ]
                )
                for offset in offsets
            ]
        )
    if samples.shape[2] < 3:
        return np.zeros(gradient.shape[0 if direction == "x" else 1])
    local_maximum = np.max(samples, axis=0)
    support = np.quantile(local_maximum, 0.15, axis=1)
    sigma = max(1.0, np.median(np.diff(valid)) * 0.20)
    return cv2.GaussianBlur(support.reshape(1, -1), (0, 0), sigma).ravel()


def _find_extent(support: np.ndarray, pitch: float) -> _Extent:
    if not np.any(support > 0):
        return _Extent(0.0, float(len(support)), 0.0, 0.0)
    low = float(np.quantile(support, 0.01))
    high = float(np.quantile(support, 0.68))
    spread = max(high - low, float(np.std(support)) * 0.35, 1e-9)
    reference = float(np.median(support))
    edge_width = max(2, int(round(pitch)))
    touch_left = float(np.mean(support[:edge_width])) >= low + 0.55 * (reference - low)
    touch_right = float(np.mean(support[-edge_width:])) >= low + 0.55 * (
        reference - low
    )
    threshold = low + 0.18 * spread
    mask = (support >= threshold).astype(np.uint8)
    close_width = max(1, int(round(0.45 * pitch)))
    open_width = max(1, int(round(0.20 * pitch)))
    mask = cv2.morphologyEx(
        mask.reshape(1, -1),
        cv2.MORPH_CLOSE,
        np.ones((1, close_width), np.uint8),
    )
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        np.ones((1, open_width), np.uint8),
    ).ravel()

    runs = _true_runs(mask)
    minimum_span = max(6 * pitch, 0.06 * len(support))
    runs = [run for run in runs if run[1] - run[0] >= minimum_span] or runs
    if not runs:
        return _Extent(0.0, float(len(support)), 0.0, 0.0)

    scores = []
    scale = np.std(support) + 1e-9
    for start, end in runs:
        inside = float(np.mean(support[start:end]))
        left = support[max(0, int(start - 2 * pitch)) : start]
        right = support[end : min(len(support), int(end + 2 * pitch))]
        outside_values = np.concatenate([left, right])
        outside = float(np.mean(outside_values)) if len(outside_values) else low
        contrast = (inside - outside) / scale
        span_score = (end - start) / len(support)
        scores.append((span_score + 0.25 * contrast, start, end, contrast))
    scores.sort(reverse=True)
    _, start, end, contrast = scores[0]
    alternative_margin = (
        float(scores[0][0] - scores[1][0]) if len(scores) > 1 else float(scores[0][0])
    )

    if touch_left:
        start = 0
    if touch_right:
        end = len(support)
    confidence = float(np.clip(0.55 + 0.18 * contrast, 0, 1))
    return _Extent(float(start), float(end), confidence, alternative_margin)


def _true_runs(mask: np.ndarray) -> list[tuple[int, int]]:
    padded = np.pad(mask.astype(np.int8), (1, 1))
    changes = np.diff(padded)
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return [(int(start), int(end)) for start, end in zip(starts, ends, strict=True)]


def _snap_extent_to_lattice(
    extent: _Extent, length: int, pitch: float, phase: float
) -> tuple[float, float]:
    positions = _lattice_positions(length, pitch, phase)
    start = float(positions[np.argmin(np.abs(positions - extent.start))])
    end_target = extent.end - 0.25 * pitch
    end = float(positions[np.argmin(np.abs(positions - end_target))])
    if extent.start <= 0.65 * pitch:
        candidates = positions[np.abs(positions) <= 0.65 * pitch]
        if len(candidates):
            start = float(candidates[np.argmin(np.abs(candidates))])
    if length - extent.end <= 0.65 * pitch:
        candidates = positions[np.abs(positions - length) <= 0.65 * pitch]
        if len(candidates):
            end = float(candidates[np.argmin(np.abs(candidates - length))])
    if end - start < 2 * pitch:
        start, end = 0.0, float(length)
    return start, end


def _measure_axis(
    gradient: np.ndarray,
    *,
    direction: str,
    pitch: float,
    phase: float,
    start: float,
    end: float,
    orthogonal_interval: tuple[float, float],
    phase_score: float,
    config: GridDetectionConfig,
) -> _AxisMeasurements:
    length = gradient.shape[1] if direction == "x" else gradient.shape[0]
    positions = _positions_between(length, pitch, phase, start, end)
    positions = positions[
        (positions >= start - 0.55 * pitch) & (positions <= end + 0.55 * pitch)
    ]
    if len(positions) < 3:
        positions = _lattice_positions(length, pitch, phase)

    orthogonal_length = gradient.shape[0] if direction == "x" else gradient.shape[1]
    orth_start = max(0, int(np.floor(orthogonal_interval[0])))
    orth_end = min(orthogonal_length, int(np.ceil(orthogonal_interval[1])))
    if orth_end - orth_start < config.caliper_count:
        orth_start, orth_end = 0, orthogonal_length
    cuts = np.linspace(orth_start, orth_end, config.caliper_count + 1).astype(int)

    measured = np.empty(len(positions), dtype=np.float64)
    widths = np.empty(len(positions), dtype=np.float64)
    confidences = np.empty(len(positions), dtype=np.float64)
    coverages = np.empty(len(positions), dtype=np.float64)
    interpolated = np.zeros(len(positions), dtype=bool)
    search = max(1.25, pitch * config.caliper_search_fraction)

    for line_index, expected in enumerate(positions):
        centres: list[float] = []
        measured_widths: list[float] = []
        amplitudes: list[float] = []
        for first, last in zip(cuts[:-1], cuts[1:], strict=True):
            if last - first < 2:
                continue
            if direction == "x":
                profile = np.quantile(gradient[first:last], 0.25, axis=0)
            else:
                profile = np.quantile(gradient[:, first:last], 0.25, axis=1)
            result = _caliper(profile, expected, search, pitch)
            if result is None:
                continue
            centre, line_width, amplitude = result
            if not np.all(np.isfinite((centre, line_width, amplitude))):
                continue
            centres.append(centre)
            measured_widths.append(line_width)
            amplitudes.append(amplitude)

        coverage = len(centres) / max(1, config.caliper_count)
        coverages[line_index] = coverage
        if centres:
            centre_values = np.asarray(centres)
            median = float(np.median(centre_values))
            deviations = np.abs(centre_values - median)
            keep = deviations <= max(0.8, 0.18 * pitch)
            if not np.any(keep):
                keep[int(np.argmin(deviations))] = True
            measured[line_index] = float(np.median(centre_values[keep]))
            widths[line_index] = float(
                np.clip(np.median(np.asarray(measured_widths)[keep]), 1.0, 0.70 * pitch)
            )
            consistency = float(
                np.exp(-np.median(deviations[keep]) / max(0.15 * pitch, 1e-9))
            )
            amplitude_score = float(np.tanh(np.median(np.asarray(amplitudes)[keep])))
            confidences[line_index] = float(
                np.clip(
                    0.55 * coverage + 0.25 * consistency + 0.20 * amplitude_score, 0, 1
                )
            )
        else:
            measured[line_index] = expected
            widths[line_index] = 1.0
            confidences[line_index] = 0.0
            interpolated[line_index] = True

    finite = np.isfinite(measured)
    measured[~finite] = positions[~finite]
    widths[~np.isfinite(widths)] = 1.0
    confidences[~np.isfinite(confidences)] = 0.0
    coverages[~np.isfinite(coverages)] = 0.0
    interpolated |= ~finite
    raw_residuals = measured - positions
    reliable = confidences >= 0.25
    systematic_offset = (
        float(np.median(raw_residuals[reliable])) if np.any(reliable) else 0.0
    )
    residuals = raw_residuals - systematic_offset
    reliable &= np.abs(residuals) <= 0.30 * pitch
    interpolated |= ~reliable

    # Preserve repeatable local sub-pixel offsets, but suppress isolated glyph
    # peaks.  This gives measured per-line centres without allowing cumulative
    # phase drift.
    correction = np.zeros_like(residuals)
    for index in range(len(correction)):
        lo, hi = max(0, index - 2), min(len(correction), index + 3)
        local = residuals[lo:hi][reliable[lo:hi]]
        if len(local):
            correction[index] = np.clip(np.median(local), -0.06 * pitch, 0.06 * pitch)
    correction[0] = 0.0
    correction[-1] = 0.0
    edges = positions + correction
    edges[~reliable] = positions[~reliable]

    # A line centre just outside a cropped image is represented by the crop edge;
    # downstream masks still retain its measured width.
    if edges[0] < 0 and abs(edges[0]) <= 0.65 * pitch:
        edges[0] = 0.0
    if edges[-1] > length and edges[-1] - length <= 0.65 * pitch:
        edges[-1] = float(length)
    valid = (edges >= -0.01) & (edges <= length + 0.01)
    edges = edges[valid]
    widths = widths[valid]
    confidences = confidences[valid]
    coverages = coverages[valid]
    interpolated = interpolated[valid]
    if len(edges) < 3:
        raise ExtractionError("GRID_NOT_FOUND", "Too few grid lines were measured")

    gaps = np.diff(edges)
    if np.any(gaps <= 0.45 * pitch) or np.any(gaps >= 1.55 * pitch):
        edges = edges[0] + np.arange(len(edges)) * pitch
    fit_residual = (
        float(np.median(np.abs(residuals[reliable]))) if np.any(reliable) else pitch
    )
    return _AxisMeasurements(
        edges=edges,
        widths=widths,
        confidences=confidences,
        coverages=coverages,
        pitch=float(np.median(np.diff(edges))),
        phase=float(edges[0] % pitch),
        phase_score=phase_score,
        fit_residual=fit_residual,
        interpolated_count=int(np.count_nonzero(interpolated)),
    )


def _caliper(
    profile: np.ndarray, expected: float, search: float, pitch: float
) -> tuple[float, float, float] | None:
    profile = cv2.GaussianBlur(
        profile.astype(np.float64).reshape(1, -1), (0, 0), 0.45
    ).ravel()
    low = max(0, int(np.floor(expected - search)))
    high = min(len(profile), int(np.ceil(expected + search)) + 1)
    if high - low < 2:
        return None
    window = profile[low:high]
    peak_offset = int(np.argmax(window))
    peak_index = low + peak_offset
    baseline = float(np.quantile(window, 0.25))
    peak = float(profile[peak_index])
    local_scale = float(np.median(np.abs(window - np.median(window)))) + 1e-6
    amplitude = (peak - baseline) / max(local_scale * 2.5, 1.0)
    if peak <= baseline + max(0.8, local_scale):
        return None

    # A narrow, blurred stroke often produces one connected gradient lobe, while
    # a wider stroke produces two separated lobes with a quiet stripe between
    # them.  Measuring only the connected component around the strongest peak
    # therefore underestimates wide lines.  When two plausible outer edges are
    # present, span both of them and their blur support; otherwise retain the
    # connected-lobe measurement for an unresolved narrow line.
    peak_threshold = baseline + max(
        0.8, local_scale, 0.18 * (peak - baseline)
    )
    local_peaks = [
        index
        for index in range(low, high)
        if profile[index] >= peak_threshold
        and profile[index] >= (profile[index - 1] if index > low else -np.inf)
        and profile[index]
        >= (profile[index + 1] if index + 1 < high else -np.inf)
    ]
    pair = _select_gradient_edge_pair(
        profile,
        local_peaks,
        expected,
        search,
        pitch,
        baseline,
        peak,
    )
    if pair is None:
        left = peak_index
        right = peak_index
        support_threshold = baseline + 0.32 * (peak - baseline)
    else:
        left, right = pair
        pair_strength = min(profile[left], profile[right]) - baseline
        support_threshold = baseline + max(
            0.6, 0.55 * local_scale, 0.20 * pair_strength
        )
        amplitude = pair_strength / max(local_scale * 2.5, 1.0)
    while left > low and profile[left - 1] >= support_threshold:
        left -= 1
    while right + 1 < high and profile[right + 1] >= support_threshold:
        right += 1
    centre = (left + right + 1) / 2
    width = max(1.0, float(right - left + 1))
    return centre, width, float(max(0.0, amplitude))


def _select_gradient_edge_pair(
    profile: np.ndarray,
    peaks: list[int],
    expected: float,
    search: float,
    pitch: float,
    baseline: float,
    maximum: float,
) -> tuple[int, int] | None:
    # Wider pairs are more likely to be a repeated in-cell texture (for example
    # the half-cell checker tiles in transparent backgrounds) than the two sides
    # of a boundary.  The final effective support may extend beyond this core
    # separation because the blur shoulders are added afterwards.
    maximum_separation = max(2, int(np.floor(0.35 * pitch)))
    best: tuple[float, int, int] | None = None
    for left_index, left in enumerate(peaks):
        for right in peaks[left_index + 1 :]:
            separation = right - left
            if separation < 2 or separation > maximum_separation:
                continue
            edge_strength = min(profile[left], profile[right]) - baseline
            valley = float(np.min(profile[left + 1 : right])) - baseline
            if edge_strength <= 0 or valley > 0.72 * edge_strength:
                continue
            centre = (left + right + 1) / 2
            if abs(centre - expected) > max(0.75, 0.07 * pitch):
                continue
            centre_cost = abs(centre - expected) / max(search, 1e-9)
            score = (
                edge_strength
                + 0.25 * (max(profile[left], profile[right]) - baseline)
                - 0.35 * centre_cost * (maximum - baseline)
            )
            if best is None or score > best[0]:
                best = (float(score), left, right)
    return None if best is None else (best[1], best[2])


def _robust_line_fit(
    indexes: np.ndarray, values: np.ndarray, weights: np.ndarray
) -> tuple[float, float]:
    design = np.column_stack((np.ones(len(indexes)), indexes))
    robust_weights = weights.copy()
    coefficients = np.asarray([values[0], np.median(np.diff(values))])
    for _ in range(6):
        weighted_design = design * np.sqrt(robust_weights[:, None])
        weighted_values = values * np.sqrt(robust_weights)
        coefficients = np.linalg.lstsq(weighted_design, weighted_values, rcond=None)[0]
        residual = values - design @ coefficients
        scale = 1.4826 * np.median(np.abs(residual - np.median(residual))) + 1e-6
        huber = np.minimum(1.0, 1.5 * scale / np.maximum(np.abs(residual), 1e-9))
        robust_weights = weights * huber
    return float(coefficients[0]), float(coefficients[1])


def _coordinate_frame_confidence(
    image_rgb: np.ndarray, x_edges: np.ndarray, y_edges: np.ndarray
) -> float:
    """Recognise a one-cell coordinate frame by appearance, without OCR."""
    rows = len(y_edges) - 1
    cols = len(x_edges) - 1
    if rows < 4 or cols < 4:
        return 0.0
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)

    def cell_features(row: int, col: int) -> tuple[float, float, float]:
        x0 = max(0, int(np.ceil(x_edges[col] + 0.16 * np.diff(x_edges)[col])))
        x1 = min(
            image_rgb.shape[1],
            int(np.floor(x_edges[col + 1] - 0.16 * np.diff(x_edges)[col])),
        )
        y0 = max(0, int(np.ceil(y_edges[row] + 0.16 * np.diff(y_edges)[row])))
        y1 = min(
            image_rgb.shape[0],
            int(np.floor(y_edges[row + 1] - 0.16 * np.diff(y_edges)[row])),
        )
        patch = lab[y0:y1, x0:x1]
        if patch.size == 0:
            return 0.0, 255.0, 0.0
        lightness = patch[..., 0]
        chroma = np.linalg.norm(patch[..., 1:] - 128, axis=2)
        light_achromatic = float(np.mean((lightness > 200) & (chroma < 18)))
        return light_achromatic, float(np.mean(chroma)), float(np.std(lightness))

    maximum_samples = 160

    def sampled_indexes(count: int) -> np.ndarray:
        return np.unique(
            np.linspace(0, count - 1, min(count, maximum_samples)).astype(int)
        )

    col_indexes = sampled_indexes(cols)
    row_indexes = sampled_indexes(rows)
    bands = [
        np.asarray([cell_features(0, int(col)) for col in col_indexes]),
        np.asarray([cell_features(rows - 1, int(col)) for col in col_indexes]),
        np.asarray([cell_features(int(row), 0) for row in row_indexes]),
        np.asarray([cell_features(int(row), cols - 1) for row in row_indexes]),
    ]
    light_score = min(float(np.median(band[:, 0])) for band in bands)
    chroma_score = max(float(np.median(band[:, 1])) for band in bands)
    detail_score = min(float(np.median(band[:, 2])) for band in bands)
    light_component = float(np.clip((light_score - 0.30) / 0.45, 0, 1))
    achromatic_component = float(np.clip((18 - chroma_score) / 16, 0, 1))
    detail_component = float(np.clip((detail_score - 5) / 18, 0, 1))
    return float(
        np.clip(
            0.50 * light_component
            + 0.25 * achromatic_component
            + 0.25 * detail_component,
            0,
            1,
        )
    )
