from __future__ import annotations

import numpy as np

from bead_extractor.cells import CellExtractionConfig, CellExtractionOutput
from bead_extractor.empty_strategies import (
    ConflictAwareEmptyConfig,
    apply_empty_strategy,
)
from bead_extractor.models import CellEstimate


def _conflicting_output(rows: int = 12, cols: int = 12) -> CellExtractionOutput:
    empty = np.zeros((rows, cols), dtype=bool)
    empty[1::2, 1::2] = True
    cells = [
        CellEstimate(
            row=index // cols,
            col=index % cols,
            observed_rgb=np.asarray((250, 250, 250), dtype=np.float64),
            code="H2",
            hex="#FEFFFF",
            distance=0.2,
            second_distance=4.0,
            trusted_pixels=9,
            is_empty=bool(empty.ravel()[index]),
            empty_confidence=0.72,
        )
        for index in range(rows * cols)
    ]
    return CellExtractionOutput(
        cells=cells,
        trusted_mask=np.zeros((1, 1), dtype=np.uint8),
        calibrated_labs=np.zeros((rows * cols, 3), dtype=np.float64),
        color_offset_lab=np.zeros(3, dtype=np.float64),
        axis_correction_lab=np.zeros((rows, cols, 3), dtype=np.float64),
        grid_cleanup_mask=np.zeros((rows, cols), dtype=bool),
        uncertain_mask=np.zeros((rows, cols), dtype=bool),
        grid_line_mask=np.zeros((1, 1), dtype=np.uint8),
        empty_mask=empty.copy(),
        empty_confidence=np.zeros((rows, cols), dtype=np.float64),
        background_diagnostics={"enabled": True},
    )


def test_baseline_strategy_is_a_frozen_no_op() -> None:
    output = _conflicting_output()
    before = output.empty_mask.copy()

    diagnostics = apply_empty_strategy(
        "baseline",
        output,
        12,
        12,
        CellExtractionConfig(),
        ConflictAwareEmptyConfig(),
        image_local_palette_available=True,
    )

    assert np.array_equal(output.empty_mask, before)
    assert sum(cell.is_empty for cell in output.cells) == 36
    assert diagnostics == {
        "strategy": "baseline",
        "baselineFrozen": True,
        "baselineAlgorithm": "checker-mixture-v1",
        "applied": False,
        "candidateCells": 0,
        "recoveredCells": 0,
    }


def test_conflict_aware_strategy_is_isolated_and_explicit() -> None:
    output = _conflicting_output()

    diagnostics = apply_empty_strategy(
        "conflict-aware",
        output,
        12,
        12,
        CellExtractionConfig(),
        ConflictAwareEmptyConfig(),
        image_local_palette_available=True,
    )

    assert diagnostics["recoveredCells"] == 36
    assert diagnostics["applied"] is True
    assert not np.any(output.empty_mask)
    assert all(not cell.is_empty for cell in output.cells)
