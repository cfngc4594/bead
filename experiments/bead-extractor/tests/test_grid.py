from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from bead_extractor.extractor import read_image
from bead_extractor.grid import GridDetectionConfig, detect_grid


def test_detects_axis_aligned_periodic_board_without_reading_text() -> None:
    rows = 24
    cols = 30
    pitch = 9
    top = 27
    left = 13
    image = np.full(
        (top + rows * pitch + 21, left * 2 + cols * pitch, 3), 248, np.uint8
    )
    colors = np.asarray(
        [[250, 244, 200], [90, 33, 33], [254, 172, 76], [47, 43, 47]],
        dtype=np.uint8,
    )
    for row in range(rows):
        for col in range(cols):
            y0 = top + row * pitch
            x0 = left + col * pitch
            color = colors[(row // 5 + col // 7) % len(colors)]
            image[y0 : y0 + pitch, x0 : x0 + pitch] = color
            noise = 235 if np.mean(color) < 120 else 90
            image[y0 + 3 : y0 + 5, x0 + 3 : x0 + 6] = noise
    line_widths_x = [1 + int((col * 7 + 3) % 11 in {0, 1}) for col in range(cols + 1)]
    line_widths_y = [1 + int((row * 5 + 2) % 13 in {0, 1}) for row in range(rows + 1)]
    for col in range(cols + 1):
        x = left + col * pitch
        line_color = (180, 95, 120) if col % 3 == 1 else (190, 190, 190)
        cv2.line(
            image,
            (x, top),
            (x, top + rows * pitch),
            line_color,
            line_widths_x[col],
        )
    for row in range(rows + 1):
        y = top + row * pitch
        line_color = (175, 105, 130) if row % 4 == 2 else (190, 190, 190)
        cv2.line(
            image,
            (left, y),
            (left + cols * pitch, y),
            line_color,
            line_widths_y[row],
        )
    success, encoded = cv2.imencode(
        ".jpg",
        cv2.cvtColor(image, cv2.COLOR_RGB2BGR),
        [cv2.IMWRITE_JPEG_QUALITY, 55],
    )
    assert success
    decoded = cv2.cvtColor(cv2.imdecode(encoded, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)

    grid = detect_grid(
        decoded,
        GridDetectionConfig(min_pitch=5, max_pitch=20, min_confidence=0.2),
    )

    assert grid.rows == rows
    assert grid.cols == cols
    assert abs(grid.pitch_x - pitch) < 0.5
    assert abs(grid.pitch_y - pitch) < 0.5
    assert grid.x_line_widths is not None
    assert grid.y_line_widths is not None
    assert len(grid.x_line_widths) == cols + 1
    assert len(grid.y_line_widths) == rows + 1
    measured_x = np.asarray(grid.x_line_widths)
    measured_y = np.asarray(grid.y_line_widths)
    true_x = np.asarray(line_widths_x)
    true_y = np.asarray(line_widths_y)
    assert np.median(measured_x[true_x == 2]) >= (
        np.median(measured_x[true_x == 1]) + 1.5
    )
    assert np.median(measured_y[true_y == 2]) >= (
        np.median(measured_y[true_y == 1]) + 1.5
    )


def test_detects_200_by_200_grid_in_experiment_image() -> None:
    image_path = Path(__file__).resolve().parents[1] / "samples" / "hutao.JPG"

    grid = detect_grid(read_image(image_path), GridDetectionConfig())

    assert grid.rows == 200
    assert grid.cols == 200
    assert grid.diagnostics["method"] == "multi-caliper-equal-center-lattice"
    assert grid.diagnostics["edgeModel"] == "per-line-width-axis-aligned"
    assert (
        grid.diagnostics["lineWidthDefinition"]
        == "full-effective-gradient-support"
    )
    assert grid.diagnostics["coordinateFrameDetected"] is True
    assert grid.diagnostics["fullGridRows"] == 202
    assert grid.diagnostics["fullGridCols"] == 202
    assert grid.x_edges is not None
    assert grid.y_edges is not None
    assert len(grid.x_edges) == 201
    assert len(grid.y_edges) == 201
