from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime

from .models import CellEstimate, GridGeometry, PaletteColor


def build_template(
    grid: GridGeometry,
    cells: list[CellEstimate],
    palette: tuple[PaletteColor, ...],
) -> dict[str, object]:
    beads = [
        None if cell.is_empty else {"code": cell.code, "hex": cell.hex}
        for cell in cells
    ]
    counts = Counter(cell.code for cell in cells if not cell.is_empty)
    color_by_code = {color.code: color for color in palette}
    stats = [
        {
            "code": code,
            "hex": color_by_code[code].hex,
            "count": counts[code],
        }
        for code in color_by_code
        if counts[code]
    ]
    # Canvas labels conventionally use width x height, while the matrix fields
    # remain explicit rows/cols and the bead array remains row-major.
    size_id = f"{grid.cols}x{grid.rows}"
    return {
        "version": 1,
        "type": "bead-template",
        "createdAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "title": f"bead-{size_id}",
        "palette": "mard",
        "size": {
            "id": size_id,
            "title": size_id,
            "rows": grid.rows,
            "cols": grid.cols,
        },
        # This is optional source-image evidence rather than a logical property of
        # the bead matrix.  Keeping the measured width of every boundary lets the
        # renderer reproduce non-uniform grids without inventing a thick-line
        # cadence.  Consumers that only need the matrix can safely ignore it.
        "sourceGrid": {
            "model": "per-line-effective-width",
            "pitchX": grid.pitch_x,
            "pitchY": grid.pitch_y,
            "lineWidthsX": grid.column_line_widths().tolist(),
            "lineWidthsY": grid.row_line_widths().tolist(),
        },
        "beads": beads,
        "stats": stats,
    }
