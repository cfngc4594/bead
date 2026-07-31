from __future__ import annotations

import numpy as np

from bead_extractor.cli import _compare_results
from bead_extractor.extractor import ExtractionConfig, extract_template
from bead_extractor.grid import GridDetectionConfig
from bead_extractor.models import GridGeometry


def test_diagnostic_limits_warn_but_do_not_stop_pipeline(monkeypatch) -> None:
    rows, cols, pitch = 2, 3, 10
    grid = GridGeometry(
        left=0,
        top=0,
        right=cols * pitch,
        bottom=rows * pitch,
        rows=rows,
        cols=cols,
        pitch_x=pitch,
        pitch_y=pitch,
        confidence=0.1,
        x_edges=tuple(float(value) for value in range(0, cols * pitch + 1, pitch)),
        y_edges=tuple(float(value) for value in range(0, rows * pitch + 1, pitch)),
        x_line_widths=(1.0,) * (cols + 1),
        y_line_widths=(1.0,) * (rows + 1),
    )
    monkeypatch.setattr("bead_extractor.extractor.detect_grid", lambda *_: grid)
    image = np.full((rows * pitch, cols * pitch, 3), (250, 244, 200), np.uint8)
    config = ExtractionConfig(
        palette_profile="221",
        max_uncertain_fraction=1.0,
        grid=GridDetectionConfig(
            max_rows=1,
            max_cols=1,
            max_cells=2,
            min_confidence=0.9,
        ),
    )

    result = extract_template(image, config)

    warning_codes = {warning["code"] for warning in result.report["warnings"]}
    assert result.accepted is True
    assert result.report["rejectionReasons"] == []
    assert len(result.template["beads"]) == rows * cols
    assert {
        "GRID_LOW_CONFIDENCE",
        "GRID_SIDE_LIMIT_EXCEEDED",
        "GRID_CELL_LIMIT_EXCEEDED",
    } <= warning_codes


def test_empty_comparison_reports_cell_level_changes() -> None:
    class Result:
        def __init__(self, beads, warnings=()):
            self.grid = GridGeometry(0, 0, 3, 2, 2, 3, 1, 1, 1)
            self.template = {
                "beads": beads,
                "stats": [{"code": "A1"}],
            }
            self.report = {"warnings": [{"code": code} for code in warnings]}

    color_a = {"code": "A1", "hex": "#111111"}
    color_b = {"code": "A2", "hex": "#222222"}
    baseline = Result([None, color_a, color_a, None, color_a, None])
    experiment = Result(
        [color_a, None, color_b, None, color_a, None],
        warnings=("EMPTY_CELL_CLASS_CONFLICT_RECOVERED",),
    )

    comparison = _compare_results(baseline, experiment)

    assert comparison["differences"]["changedCells"] == 3
    assert comparison["differences"]["emptyToBead"] == 1
    assert comparison["differences"]["beadToEmpty"] == 1
    assert comparison["differences"]["colorChanged"] == 1
    assert comparison["differences"]["cells"][0]["row"] == 0
    assert comparison["differences"]["cells"][0]["col"] == 0
