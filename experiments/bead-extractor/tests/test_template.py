from __future__ import annotations

import numpy as np

from bead_extractor.models import CellEstimate, GridGeometry
from bead_extractor.palette import load_palette
from bead_extractor.template import build_template


def test_template_is_row_major_and_stats_are_recomputed() -> None:
    palette = load_palette("221")
    colors = {color.code: color for color in palette}
    codes = ["A1", "A2", "A1", "A3"]
    cells = [
        CellEstimate(
            row=index // 2,
            col=index % 2,
            observed_rgb=np.asarray(colors[code].rgb),
            code=code,
            hex=colors[code].hex,
            distance=0,
            second_distance=10,
            trusted_pixels=4,
        )
        for index, code in enumerate(codes)
    ]
    grid = GridGeometry(0, 0, 16, 16, 2, 2, 8, 8, 1)

    template = build_template(grid, cells, palette)

    assert [bead["code"] for bead in template["beads"]] == codes
    assert template["size"]["rows"] == 2
    assert template["size"]["cols"] == 2
    assert template["stats"][0]["count"] == 2
    assert template["sourceGrid"] == {
        "model": "per-line-effective-width",
        "pitchX": 8,
        "pitchY": 8,
        "lineWidthsX": [1.0, 1.0, 1.0],
        "lineWidthsY": [1.0, 1.0, 1.0],
    }


def test_rectangular_size_label_is_width_by_height() -> None:
    palette = load_palette("221")
    color = palette[0]
    cells = [
        CellEstimate(
            row=index // 3,
            col=index % 3,
            observed_rgb=np.asarray(color.rgb),
            code=color.code,
            hex=color.hex,
            distance=0,
            second_distance=10,
            trusted_pixels=4,
        )
        for index in range(6)
    ]
    grid = GridGeometry(0, 0, 24, 16, 2, 3, 8, 8, 1)

    template = build_template(grid, cells, palette)

    assert template["size"] == {
        "id": "3x2",
        "title": "3x2",
        "rows": 2,
        "cols": 3,
    }
    assert len(template["beads"]) == 6
