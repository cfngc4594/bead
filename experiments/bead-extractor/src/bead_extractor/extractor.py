from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .cells import (
    CellExtractionConfig,
    CellExtractionOutput,
    classify_cells_from_swatches,
    extract_cells,
    restrict_cells_to_palette,
)
from .diagnostics import create_artifacts
from .empty_strategies import (
    ConflictAwareEmptyConfig,
    EmptyStrategy,
    apply_empty_strategy,
)
from .errors import ExtractionError
from .grid import GridDetectionConfig, detect_grid
from .models import ExtractionResult, PaletteColor
from .palette import load_palette
from .swatches import detect_palette_swatches
from .template import build_template


@dataclass(frozen=True, slots=True)
class ExtractionConfig:
    palette_profile: str = "auto"
    empty_strategy: EmptyStrategy = "baseline"
    max_uncertain_fraction: float = 0.005
    grid: GridDetectionConfig = field(default_factory=GridDetectionConfig)
    cells: CellExtractionConfig = field(default_factory=CellExtractionConfig)
    conflict_empty: ConflictAwareEmptyConfig = field(
        default_factory=ConflictAwareEmptyConfig
    )


def read_image(path: Path) -> np.ndarray:
    encoded = np.fromfile(path, dtype=np.uint8)
    image_bgr = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ExtractionError("IMAGE_READ_FAILED", f"Cannot read image: {path}")
    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)


def extract_template(
    image: Path | np.ndarray, config: ExtractionConfig | None = None
) -> ExtractionResult:
    config = config or ExtractionConfig()
    image_rgb = read_image(image) if isinstance(image, Path) else image.copy()
    grid = detect_grid(image_rgb, config.grid)
    palette_selection: dict[str, Any]
    palette_warning: dict[str, Any] | None = None
    if config.palette_profile == "auto":
        palette_221 = load_palette("221")
        palette_264 = load_palette("264")
        output_221 = extract_cells(image_rgb, grid, palette_221, config.cells)
        output_264 = extract_cells(image_rgb, grid, palette_264, config.cells)
        selected_profile, decisive, candidate_scores = _select_palette_profile(
            output_221,
            output_264,
            palette_221,
        )
        if selected_profile == "221":
            palette, cell_output = palette_221, output_221
        else:
            palette, cell_output = palette_264, output_264
        palette_selection = {
            "requested": "auto",
            "selected": selected_profile,
            "decisive": decisive,
            "candidates": candidate_scores,
        }
        if not decisive:
            palette_warning = {
                "code": "PALETTE_PROFILE_AMBIGUOUS",
                "message": (
                    "The 221- and 264-colour profiles are similarly plausible; "
                    f"{selected_profile} was used as the canonical output"
                ),
                "selected": selected_profile,
                "candidates": candidate_scores,
            }
    else:
        palette = load_palette(config.palette_profile)
        cell_output = extract_cells(image_rgb, grid, palette, config.cells)
        selected_profile = config.palette_profile
        palette_selection = {
            "requested": config.palette_profile,
            "selected": selected_profile,
            "decisive": True,
        }
    swatches = detect_palette_swatches(
        image_rgb,
        grid,
        palette,
        cell_output.color_offset_lab,
        cell_output.cells,
    )
    swatch_classification_applied = False
    if swatches.assigned_indexes is not None and swatches.prototype_labs is not None:
        classify_cells_from_swatches(
            cell_output,
            palette,
            swatches.assigned_indexes,
            swatches.prototype_labs,
            config.cells,
        )
        swatch_classification_applied = True
    elif swatches.active_indexes is not None:
        restrict_cells_to_palette(
            cell_output, palette, swatches.active_indexes, config.cells
        )
        swatch_classification_applied = True
    empty_decision = apply_empty_strategy(
        config.empty_strategy,
        cell_output,
        grid.rows,
        grid.cols,
        config.cells,
        config.conflict_empty,
        image_local_palette_available=swatch_classification_applied,
    )
    recovered_empty_cells = int(empty_decision["recoveredCells"])
    cells = cell_output.cells
    nonempty_cells = [cell for cell in cells if not cell.is_empty]
    uncertain_count = int(np.count_nonzero(cell_output.uncertain_mask))
    uncertain_fraction = uncertain_count / max(1, len(nonempty_cells))
    template = build_template(grid, cells, palette)
    artifacts = create_artifacts(
        image_rgb,
        grid,
        cells,
        cell_output.trusted_mask,
        cell_output.uncertain_mask,
        cell_output.grid_line_mask,
        cell_output.empty_mask,
    )

    distances = np.asarray([cell.distance for cell in nonempty_cells])
    margins = np.asarray([cell.margin for cell in nonempty_cells])
    warnings: list[dict[str, Any]] = []
    if palette_warning is not None:
        warnings.append(palette_warning)
    if recovered_empty_cells:
        warnings.append(
            {
                "code": "EMPTY_CELL_CLASS_CONFLICT_RECOVERED",
                "message": (
                    "Many empty-cell decisions conflicted with surrounding "
                    "image-local palette evidence and were retained as beads"
                ),
                "recoveredCells": recovered_empty_cells,
            }
        )
    swatch_reason = swatches.diagnostics.get("reason")
    if swatch_reason in {
        "no-regular-swatch-boundaries",
        "swatch-layout-or-colour-match-is-ambiguous",
    }:
        warnings.append(
            {
                "code": "PALETTE_SWATCHES_UNCERTAIN",
                "message": (
                    "A possible colour table was found but could not be matched "
                    "confidently; full-palette classification was retained"
                ),
                "reason": swatch_reason,
            }
        )
    if uncertain_fraction > config.max_uncertain_fraction:
        warnings.append(
            {
                "code": "COLOR_LOW_CONFIDENCE",
                "message": "Too many cells have ambiguous or distant palette matches",
                "uncertainCells": uncertain_count,
                "uncertainFraction": uncertain_fraction,
                "maximum": config.max_uncertain_fraction,
            }
        )
    if grid.confidence < config.grid.min_confidence:
        warnings.append(
            {
                "code": "GRID_LOW_CONFIDENCE",
                "message": (
                    "Grid diagnostics are below the configured confidence target"
                ),
                "confidence": grid.confidence,
                "target": config.grid.min_confidence,
            }
        )
    if grid.rows > config.grid.max_rows or grid.cols > config.grid.max_cols:
        warnings.append(
            {
                "code": "GRID_SIDE_LIMIT_EXCEEDED",
                "message": "Detected dimensions exceed the configured diagnostic limit",
                "rows": grid.rows,
                "cols": grid.cols,
                "maxRows": config.grid.max_rows,
                "maxCols": config.grid.max_cols,
            }
        )
    if grid.rows * grid.cols > config.grid.max_cells:
        warnings.append(
            {
                "code": "GRID_CELL_LIMIT_EXCEEDED",
                "message": (
                    "Detected cell count exceeds the configured diagnostic limit"
                ),
                "cells": grid.rows * grid.cols,
                "maximum": config.grid.max_cells,
            }
        )
    interpolated_x = int(grid.diagnostics.get("interpolatedLinesX", 0))
    interpolated_y = int(grid.diagnostics.get("interpolatedLinesY", 0))
    if (
        interpolated_x / (grid.cols + 1) > 0.15
        or interpolated_y / (grid.rows + 1) > 0.15
    ):
        warnings.append(
            {
                "code": "GRID_MANY_INTERPOLATED_LINES",
                "message": (
                    "Many weak boundaries were filled from the equal-centre lattice"
                ),
                "interpolatedLinesX": interpolated_x,
                "interpolatedLinesY": interpolated_y,
            }
        )

    report: dict[str, Any] = {
        "accepted": True,
        "warnings": warnings,
        "rejectionReasons": [],
        "image": {"width": image_rgb.shape[1], "height": image_rgb.shape[0]},
        "paletteProfile": selected_profile,
        "paletteSelection": palette_selection,
        "paletteColorCountAfterAliases": len(palette),
        "paletteSwatches": swatches.diagnostics,
        "canonicalAliases": {"R11": "Q4"},
        "grid": {
            "left": grid.left,
            "top": grid.top,
            "right": grid.right,
            "bottom": grid.bottom,
            "rows": grid.rows,
            "cols": grid.cols,
            "pitchX": grid.pitch_x,
            "pitchY": grid.pitch_y,
            "confidence": grid.confidence,
            "diagnostics": grid.diagnostics,
        },
        "emptyCells": {
            **cell_output.background_diagnostics,
            "decision": empty_decision,
            "count": int(np.count_nonzero(cell_output.empty_mask)),
            "fraction": float(np.mean(cell_output.empty_mask)),
        },
        "colorCalibration": {
            "labOffset": cell_output.color_offset_lab.tolist(),
            "axisCorrectionAbsMedian": np.median(
                np.abs(cell_output.axis_correction_lab), axis=(0, 1)
            ).tolist(),
            "axisCorrectionAbsMax": np.max(
                np.abs(cell_output.axis_correction_lab), axis=(0, 1)
            ).tolist(),
        },
        "colorConfidence": {
            "predictedColorCount": len({cell.code for cell in nonempty_cells}),
            "uncertainCells": uncertain_count,
            "uncertainFraction": uncertain_fraction,
            "maximumUncertainFraction": config.max_uncertain_fraction,
            "deltaEMedian": float(np.median(distances)) if len(distances) else 0.0,
            "deltaEP95": float(np.quantile(distances, 0.95)) if len(distances) else 0.0,
            "deltaEMax": float(np.max(distances)) if len(distances) else 0.0,
            "marginMedian": float(np.median(margins)) if len(margins) else 0.0,
            "marginP05": float(np.quantile(margins, 0.05)) if len(margins) else 0.0,
            "gridLeakageCellsCorrected": int(
                np.count_nonzero(cell_output.grid_cleanup_mask)
            ),
        },
        "configuration": {
            "emptyStrategy": config.empty_strategy,
            "grid": asdict(config.grid),
            "cells": asdict(config.cells),
            "conflictAwareEmpty": asdict(config.conflict_empty),
        },
    }
    return ExtractionResult(
        accepted=True,
        template=template,
        report=report,
        grid=grid,
        cells=cells,
        artifacts=artifacts,
    )


def _select_palette_profile(
    output_221: CellExtractionOutput,
    output_264: CellExtractionOutput,
    palette_221: tuple[PaletteColor, ...],
) -> tuple[str, bool, dict[str, dict[str, float]]]:
    codes_221 = {color.canonical_code for color in palette_221}

    def score(output: CellExtractionOutput) -> dict[str, float]:
        cells = [cell for cell in output.cells if not cell.is_empty]
        distances = np.asarray([cell.distance for cell in cells], dtype=np.float64)
        uncertain = output.uncertain_mask[~output.empty_mask]
        return {
            "deltaEMedian": float(np.median(distances)) if len(distances) else 0.0,
            "deltaEP95": (
                float(np.quantile(distances, 0.95)) if len(distances) else 0.0
            ),
            "uncertainFraction": float(np.mean(uncertain)) if len(uncertain) else 0.0,
        }

    score_221 = score(output_221)
    score_264 = score(output_264)
    nonempty_264 = [cell for cell in output_264.cells if not cell.is_empty]
    specific_confident = [
        cell
        for cell in nonempty_264
        if cell.code not in codes_221 and cell.distance <= 5.0 and cell.margin >= 0.8
    ]
    specific_fraction = len(specific_confident) / max(1, len(nonempty_264))
    score_264["confident264OnlyFraction"] = specific_fraction
    score_221["confident264OnlyFraction"] = 0.0
    combined_221 = score_221["deltaEMedian"] + 0.25 * score_221["deltaEP95"]
    combined_264 = score_264["deltaEMedian"] + 0.25 * score_264["deltaEP95"]
    improvement = combined_221 - combined_264

    if specific_fraction >= 0.005 and improvement >= 0.08:
        return "264", True, {"221": score_221, "264": score_264}
    if specific_fraction <= 0.001 and improvement <= 0.12:
        return "221", True, {"221": score_221, "264": score_264}
    return "264", False, {"221": score_221, "264": score_264}
