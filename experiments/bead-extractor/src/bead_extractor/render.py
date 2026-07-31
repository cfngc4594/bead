from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .errors import ExtractionError

HEX_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


def load_template(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ExtractionError(
            "TEMPLATE_READ_FAILED", f"Cannot read template JSON: {path}"
        ) from error
    validate_template(data)
    return data


def validate_template(data: object) -> None:
    if not isinstance(data, dict) or data.get("type") != "bead-template":
        raise ExtractionError(
            "INVALID_TEMPLATE", "JSON is not a bead-template document"
        )
    size = data.get("size")
    beads = data.get("beads")
    if not isinstance(size, dict) or not isinstance(beads, list):
        raise ExtractionError(
            "INVALID_TEMPLATE", "Template must contain size and beads"
        )
    rows = size.get("rows")
    cols = size.get("cols")
    if (
        not isinstance(rows, int)
        or isinstance(rows, bool)
        or not isinstance(cols, int)
        or isinstance(cols, bool)
        or rows <= 0
        or cols <= 0
    ):
        raise ExtractionError(
            "INVALID_TEMPLATE", "Template rows and cols must be positive integers"
        )
    expected = rows * cols
    if len(beads) != expected:
        raise ExtractionError(
            "TEMPLATE_SIZE_MISMATCH",
            "beads length does not equal rows * cols",
            {"rows": rows, "cols": cols, "expected": expected, "actual": len(beads)},
        )
    for index, bead in enumerate(beads):
        if bead is None:
            continue
        if not isinstance(bead, dict):
            raise ExtractionError(
                "INVALID_TEMPLATE_CELL",
                "Bead must be an object or null",
                {"index": index},
            )
        code = bead.get("code")
        color = bead.get("hex")
        if (
            not isinstance(code, str)
            or not isinstance(color, str)
            or not HEX_PATTERN.fullmatch(color)
        ):
            raise ExtractionError(
                "INVALID_TEMPLATE_CELL",
                "Bead code or hex color is invalid",
                {"index": index},
            )
    source_grid = data.get("sourceGrid")
    if source_grid is not None:
        _validate_source_grid(source_grid, rows, cols)


def render_template(
    template: dict[str, Any],
    *,
    width: int | None = None,
    height: int | None = None,
    cell_size: int = 8,
    grid: str = "none",
    show_codes: bool = False,
    empty_color: str = "#FFFFFF",
) -> np.ndarray:
    validate_template(template)
    rows = template["size"]["rows"]
    cols = template["size"]["cols"]
    width = width or cols * cell_size
    height = height or rows * cell_size
    if width < cols or height < rows:
        raise ExtractionError(
            "RENDER_SIZE_TOO_SMALL",
            "Output must have at least one pixel per cell",
            {"width": width, "height": height, "rows": rows, "cols": cols},
        )
    if grid not in {"none", "major", "all"}:
        raise ExtractionError("INVALID_GRID_MODE", f"Unsupported grid mode: {grid}")
    if not HEX_PATTERN.fullmatch(empty_color):
        raise ExtractionError("INVALID_EMPTY_COLOR", "empty_color must be #RRGGBB")

    background = _hex_to_rgb(empty_color)
    image = np.empty((height, width, 3), dtype=np.uint8)
    image[:] = background
    x_edges = np.rint(np.linspace(0, width, cols + 1)).astype(int)
    y_edges = np.rint(np.linspace(0, height, rows + 1)).astype(int)
    x_line_widths, y_line_widths = _scaled_grid_line_widths(
        template, width, height, rows, cols
    )

    for index, bead in enumerate(template["beads"]):
        if bead is None:
            continue
        row, col = divmod(index, cols)
        image[y_edges[row] : y_edges[row + 1], x_edges[col] : x_edges[col + 1]] = (
            _hex_to_rgb(bead["hex"])
        )

    if grid != "none":
        _draw_grid(
            image,
            x_edges,
            y_edges,
            x_line_widths,
            y_line_widths,
            grid,
        )
    if show_codes:
        _draw_codes(image, template["beads"], x_edges, y_edges, cols)
    return image


def write_png(path: Path, image_rgb: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    success, encoded = cv2.imencode(".png", image_bgr)
    if not success:
        raise ExtractionError("IMAGE_WRITE_FAILED", f"Cannot encode PNG: {path}")
    encoded.tofile(path)


def _draw_grid(
    image: np.ndarray,
    x_edges: np.ndarray,
    y_edges: np.ndarray,
    x_line_widths: np.ndarray,
    y_line_widths: np.ndarray,
    mode: str,
) -> None:
    if mode == "all":
        for x, line_width in zip(x_edges, x_line_widths, strict=True):
            _draw_vertical_band(image, int(x), float(line_width), (210, 210, 210))
        for y, line_width in zip(y_edges, y_line_widths, strict=True):
            _draw_horizontal_band(image, int(y), float(line_width), (210, 210, 210))
    for index, (x, line_width) in enumerate(
        zip(x_edges, x_line_widths, strict=True)
    ):
        if index % 10 == 0:
            _draw_vertical_band(image, int(x), float(line_width), (190, 105, 105))
    for index, (y, line_width) in enumerate(
        zip(y_edges, y_line_widths, strict=True)
    ):
        if index % 10 == 0:
            _draw_horizontal_band(image, int(y), float(line_width), (190, 105, 105))


def _validate_source_grid(source_grid: object, rows: int, cols: int) -> None:
    if not isinstance(source_grid, dict):
        raise ExtractionError(
            "INVALID_SOURCE_GRID", "sourceGrid must be an object"
        )
    for key in ("pitchX", "pitchY"):
        value = source_grid.get(key)
        if (
            not isinstance(value, (int, float))
            or isinstance(value, bool)
            or not math.isfinite(value)
            or value <= 0
        ):
            raise ExtractionError(
                "INVALID_SOURCE_GRID", f"sourceGrid.{key} must be positive"
            )
    for key, expected in (("lineWidthsX", cols + 1), ("lineWidthsY", rows + 1)):
        values = source_grid.get(key)
        if not isinstance(values, list) or len(values) != expected:
            raise ExtractionError(
                "INVALID_SOURCE_GRID",
                f"sourceGrid.{key} must contain one width per grid line",
                {"expected": expected},
            )
        if any(
            not isinstance(value, (int, float))
            or isinstance(value, bool)
            or not math.isfinite(value)
            or value <= 0
            for value in values
        ):
            raise ExtractionError(
                "INVALID_SOURCE_GRID",
                f"sourceGrid.{key} values must be positive",
            )


def _scaled_grid_line_widths(
    template: dict[str, Any], width: int, height: int, rows: int, cols: int
) -> tuple[np.ndarray, np.ndarray]:
    source_grid = template.get("sourceGrid")
    if source_grid is None:
        return np.ones(cols + 1), np.ones(rows + 1)
    source_cell_width = float(source_grid["pitchX"])
    source_cell_height = float(source_grid["pitchY"])
    output_cell_width = width / cols
    output_cell_height = height / rows
    x_widths = np.asarray(source_grid["lineWidthsX"], dtype=np.float64)
    y_widths = np.asarray(source_grid["lineWidthsY"], dtype=np.float64)
    return (
        x_widths * output_cell_width / source_cell_width,
        y_widths * output_cell_height / source_cell_height,
    )


def _band_slice(centre: int, line_width: float, length: int) -> slice:
    # OpenCV's line thickness expands in unintuitive odd increments.  A slice
    # gives an exact, deterministic raster width for every independently measured
    # line and also keeps the right/bottom outer border inside the image.
    pixels = max(1, int(round(line_width)))
    centre = int(np.clip(centre, 0, length - 1))
    start = centre - pixels // 2
    end = start + pixels
    if start < 0:
        end -= start
        start = 0
    if end > length:
        start -= end - length
        end = length
    return slice(max(0, start), min(length, end))


def _draw_vertical_band(
    image: np.ndarray, centre: int, line_width: float, color: tuple[int, int, int]
) -> None:
    image[:, _band_slice(centre, line_width, image.shape[1])] = color


def _draw_horizontal_band(
    image: np.ndarray, centre: int, line_width: float, color: tuple[int, int, int]
) -> None:
    image[_band_slice(centre, line_width, image.shape[0]), :] = color


def _draw_codes(
    image: np.ndarray,
    beads: list[dict[str, str] | None],
    x_edges: np.ndarray,
    y_edges: np.ndarray,
    cols: int,
) -> None:
    minimum_cell = min(np.min(np.diff(x_edges)), np.min(np.diff(y_edges)))
    if minimum_cell < 14:
        raise ExtractionError(
            "CODES_REQUIRE_LARGER_CELLS",
            "Code labels require cells of at least 14 pixels",
        )
    font_scale = max(0.25, minimum_cell / 48)
    for index, bead in enumerate(beads):
        if bead is None:
            continue
        row, col = divmod(index, cols)
        x0, x1 = int(x_edges[col]), int(x_edges[col + 1])
        y0, y1 = int(y_edges[row]), int(y_edges[row + 1])
        text = bead["code"]
        size, _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)
        x = x0 + max(0, (x1 - x0 - size[0]) // 2)
        y = y0 + max(size[1], (y1 - y0 + size[1]) // 2)
        rgb = np.mean(image[y0:y1, x0:x1], axis=(0, 1))
        color = (245, 245, 245) if np.mean(rgb) < 120 else (70, 70, 70)
        cv2.putText(
            image,
            text,
            (x, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            color,
            1,
            cv2.LINE_AA,
        )


def _hex_to_rgb(value: str) -> tuple[int, int, int]:
    return tuple(int(value[index : index + 2], 16) for index in (1, 3, 5))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bead-render", description="Render a bead-template JSON file to PNG"
    )
    parser.add_argument("template", type=Path)
    parser.add_argument("--output", "-o", type=Path, required=True)
    parser.add_argument("--width", type=int)
    parser.add_argument("--height", type=int)
    parser.add_argument("--cell-size", type=int, default=8)
    parser.add_argument("--grid", choices=("none", "major", "all"), default="none")
    parser.add_argument("--show-codes", action="store_true")
    parser.add_argument("--empty-color", default="#FFFFFF")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        template = load_template(args.template.resolve())
        image = render_template(
            template,
            width=args.width,
            height=args.height,
            cell_size=args.cell_size,
            grid=args.grid,
            show_codes=args.show_codes,
            empty_color=args.empty_color,
        )
        output = args.output.resolve()
        write_png(output, image)
    except ExtractionError as error:
        print(str(error))
        return 2
    print(f"Rendered {image.shape[1]}x{image.shape[0]} PNG: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
