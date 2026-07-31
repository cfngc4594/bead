from __future__ import annotations

import cv2
import numpy as np

from bead_extractor.cells import (
    CellExtractionConfig,
    CellExtractionOutput,
    _estimate_cell_color,
    _remove_grid_label_leakage,
    classify_cells_from_swatches,
    extract_cells,
)
from bead_extractor.models import CellEstimate, GridGeometry, PaletteColor
from bead_extractor.palette import load_palette, rgb_to_lab


def test_dense_color_cluster_rejects_grid_and_center_glyph() -> None:
    palette = load_palette("264")
    expected = next(color for color in palette if color.code == "A1")
    image = np.full((11, 11, 3), expected.rgb, dtype=np.uint8)
    cv2.rectangle(image, (0, 0), (10, 10), (185, 82, 82), 1)
    image[4:7, 3:8] = (45, 45, 45)

    grid = GridGeometry(
        left=0,
        top=0,
        right=11,
        bottom=11,
        rows=1,
        cols=1,
        pitch_x=11,
        pitch_y=11,
        confidence=1,
    )
    output = extract_cells(image, grid, palette, CellExtractionConfig())

    assert output.cells[0].code == expected.canonical_code
    assert np.linalg.norm(output.cells[0].observed_rgb - expected.rgb) < 1
    assert output.cells[0].trusted_pixels > 40


def test_cleanup_removes_only_axis_wide_near_color_leakage() -> None:
    palette_labs = np.asarray(
        [
            [50.0, 0.0, 0.0],
            [53.0, 0.0, 0.0],
            [80.0, 35.0, 35.0],
        ]
    )
    labels = np.zeros((9, 30), dtype=int)
    labels[4] = 1
    labels[4, 10] = 2

    cleaned, changed = _remove_grid_label_leakage(
        labels.ravel(),
        palette_labs,
        rows=9,
        cols=30,
        config=CellExtractionConfig(),
    )
    cleaned = cleaned.reshape(9, 30)

    assert np.all(cleaned[4, :10] == 0)
    assert cleaned[4, 10] == 2
    assert np.count_nonzero(changed) == 29


def test_adjacent_cells_never_share_a_boundary_pixel() -> None:
    image = np.full((8, 15, 3), (210, 180, 150), dtype=np.uint8)
    config = CellExtractionConfig()

    _, left_coordinates = _estimate_cell_color(image, 0.0, 7.5, 0.0, 8.0, config)
    _, right_coordinates = _estimate_cell_color(image, 7.5, 15.0, 0.0, 8.0, config)

    left_pixels = {tuple(value) for value in left_coordinates.tolist()}
    right_pixels = {tuple(value) for value in right_coordinates.tolist()}
    assert left_pixels.isdisjoint(right_pixels)
    assert len(left_pixels | right_pixels) == image.shape[0] * image.shape[1]


def test_repeated_checker_background_becomes_null_without_fixed_rgb_rule() -> None:
    rows, cols, pitch = 6, 7, 16
    yy, xx = np.mgrid[: rows * pitch, : cols * pitch]
    checker = ((yy // 4 + xx // 4) % 2).astype(bool)
    image = np.empty((rows * pitch, cols * pitch, 3), dtype=np.uint8)
    image[checker] = (238, 238, 238)
    image[~checker] = (253, 253, 253)
    palette = load_palette("264")
    dark = next(color for color in palette if color.code == "A1")
    filled = {(2, 2), (2, 3), (3, 2), (3, 3)}
    for row, col in filled:
        image[
            row * pitch + 1 : (row + 1) * pitch,
            col * pitch + 1 : (col + 1) * pitch,
        ] = dark.rgb
    for edge in range(cols + 1):
        cv2.line(
            image, (edge * pitch, 0), (edge * pitch, rows * pitch - 1), (190,) * 3, 1
        )
    for edge in range(rows + 1):
        cv2.line(
            image, (0, edge * pitch), (cols * pitch - 1, edge * pitch), (190,) * 3, 1
        )

    grid = GridGeometry(
        left=0,
        top=0,
        right=cols * pitch,
        bottom=rows * pitch,
        rows=rows,
        cols=cols,
        pitch_x=pitch,
        pitch_y=pitch,
        confidence=1,
        x_edges=tuple(float(value) for value in range(0, cols * pitch + 1, pitch)),
        y_edges=tuple(float(value) for value in range(0, rows * pitch + 1, pitch)),
        x_line_widths=(1.0,) * (cols + 1),
        y_line_widths=(1.0,) * (rows + 1),
    )
    output = extract_cells(image, grid, palette, CellExtractionConfig())

    assert output.background_diagnostics["enabled"] is True
    assert np.count_nonzero(output.empty_mask) == rows * cols - len(filled)
    for row, col in filled:
        assert not output.empty_mask[row, col]


def test_swatch_prototypes_are_refined_from_image_populations() -> None:
    palette = (
        PaletteColor("P0", "#646464", (100, 100, 100), "P0"),
        PaletteColor("P1", "#A0A0A0", (160, 160, 160), "P1"),
    )
    observed = [(100, 100, 100)] * 5 + [(160, 160, 160)] * 5
    cells = [
        CellEstimate(
            row=index // 5,
            col=index % 5,
            observed_rgb=np.asarray(rgb, dtype=np.float64),
            code="P0",
            hex="#646464",
            distance=99.0,
            second_distance=100.0,
            trusted_pixels=9,
        )
        for index, rgb in enumerate(observed)
    ]
    output = CellExtractionOutput(
        cells=cells,
        trusted_mask=np.zeros((1, 1), dtype=np.uint8),
        calibrated_labs=np.zeros((10, 3), dtype=np.float64),
        color_offset_lab=np.zeros(3, dtype=np.float64),
        axis_correction_lab=np.zeros((2, 5, 3), dtype=np.float64),
        grid_cleanup_mask=np.zeros((2, 5), dtype=bool),
        uncertain_mask=np.zeros((2, 5), dtype=bool),
        grid_line_mask=np.zeros((1, 1), dtype=np.uint8),
        empty_mask=np.zeros((2, 5), dtype=bool),
        empty_confidence=np.zeros((2, 5), dtype=np.float64),
        background_diagnostics={"enabled": False},
    )
    initial_prototypes = rgb_to_lab(
        np.asarray([(90, 90, 90), (140, 140, 140)], dtype=np.float64)
    )

    classify_cells_from_swatches(
        output,
        palette,
        (0, 1),
        tuple(tuple(float(value) for value in row) for row in initial_prototypes),
        CellExtractionConfig(),
    )

    assert [cell.code for cell in output.cells] == ["P0"] * 5 + ["P1"] * 5
    assert max(cell.distance for cell in output.cells) < 1.0

