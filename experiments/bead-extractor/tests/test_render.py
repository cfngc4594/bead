from __future__ import annotations

import pytest

from bead_extractor.errors import ExtractionError
from bead_extractor.render import render_template, validate_template


def _template() -> dict:
    return {
        "version": 1,
        "type": "bead-template",
        "createdAt": "2026-01-01T00:00:00Z",
        "title": "test",
        "palette": "mard",
        "size": {"id": "2x2", "title": "2x2", "rows": 2, "cols": 2},
        "beads": [
            {"code": "A1", "hex": "#FF0000"},
            {"code": "A2", "hex": "#00FF00"},
            None,
            {"code": "A3", "hex": "#0000FF"},
        ],
        "stats": [],
    }


def test_renders_row_major_cells_and_empty_background() -> None:
    image = render_template(_template(), width=6, height=4)

    assert image.shape == (4, 6, 3)
    assert tuple(image[0, 0]) == (255, 0, 0)
    assert tuple(image[0, 5]) == (0, 255, 0)
    assert tuple(image[3, 0]) == (255, 255, 255)
    assert tuple(image[3, 5]) == (0, 0, 255)


def test_rejects_mismatched_bead_count() -> None:
    template = _template()
    template["beads"].pop()

    with pytest.raises(ExtractionError, match="TEMPLATE_SIZE_MISMATCH"):
        validate_template(template)


def test_renders_each_measured_grid_line_at_its_own_scaled_width() -> None:
    template = _template()
    template["sourceGrid"] = {
        "model": "per-line-effective-width",
        "pitchX": 6,
        "pitchY": 6,
        "lineWidthsX": [1, 3, 1],
        "lineWidthsY": [1, 2, 1],
    }

    image = render_template(template, width=12, height=12, grid="all")

    regular_grid = (210, 210, 210)
    assert tuple(image[3, 4]) == (255, 0, 0)
    assert tuple(image[3, 5]) == regular_grid
    assert tuple(image[3, 6]) == regular_grid
    assert tuple(image[3, 7]) == regular_grid
    assert tuple(image[4, 3]) == (255, 0, 0)
    assert tuple(image[5, 3]) == regular_grid
    assert tuple(image[6, 3]) == regular_grid


def test_rejects_source_grid_with_missing_per_line_widths() -> None:
    template = _template()
    template["sourceGrid"] = {
        "pitchX": 6,
        "pitchY": 6,
        "lineWidthsX": [1, 2],
        "lineWidthsY": [1, 1, 1],
    }

    with pytest.raises(ExtractionError, match="one width per grid line"):
        validate_template(template)
