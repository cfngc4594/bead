from __future__ import annotations

import cv2
import numpy as np

from .models import CellEstimate, ExtractionArtifacts, GridGeometry


def create_artifacts(
    image_rgb: np.ndarray,
    grid: GridGeometry,
    cells: list[CellEstimate],
    trusted_mask: np.ndarray,
    uncertain_mask: np.ndarray,
    grid_line_mask: np.ndarray,
    empty_mask: np.ndarray,
) -> ExtractionArtifacts:
    overlay = image_rgb.copy()
    x_edges = grid.column_edges()
    y_edges = grid.row_edges()
    x_widths = grid.column_line_widths()
    y_widths = grid.row_line_widths()
    x_confidences = (
        np.asarray(grid.x_line_confidences)
        if grid.x_line_confidences is not None
        else np.ones(len(x_edges))
    )
    y_confidences = (
        np.asarray(grid.y_line_confidences)
        if grid.y_line_confidences is not None
        else np.ones(len(y_edges))
    )
    bands = overlay.copy()
    for edge, line_width in zip(x_edges, x_widths, strict=True):
        x0 = int(np.floor(edge - line_width / 2))
        x1 = int(np.ceil(edge + line_width / 2))
        cv2.rectangle(
            bands,
            (x0, int(round(grid.top))),
            (x1, int(round(grid.bottom))),
            (255, 210, 30),
            -1,
        )
    for edge, line_width in zip(y_edges, y_widths, strict=True):
        y0 = int(np.floor(edge - line_width / 2))
        y1 = int(np.ceil(edge + line_width / 2))
        cv2.rectangle(
            bands,
            (int(round(grid.left)), y0),
            (int(round(grid.right)), y1),
            (255, 210, 30),
            -1,
        )
    overlay = cv2.addWeighted(overlay, 0.76, bands, 0.24, 0)
    for edge, confidence in zip(x_edges, x_confidences, strict=True):
        x = int(round(edge))
        color = (30, 210, 250) if confidence >= 0.35 else (255, 40, 180)
        cv2.line(
            overlay,
            (x, int(round(grid.top))),
            (x, int(round(grid.bottom))),
            color,
            1,
        )
    for edge, confidence in zip(y_edges, y_confidences, strict=True):
        y = int(round(edge))
        color = (30, 210, 250) if confidence >= 0.35 else (255, 40, 180)
        cv2.line(
            overlay,
            (int(round(grid.left)), y),
            (int(round(grid.right)), y),
            color,
            1,
        )

    cell_confidence = np.asarray(
        [
            min(1.0, max(0.0, cell.margin / 3.0))
            * min(1.0, max(0.0, (14.0 - cell.distance) / 10.0))
            for cell in cells
        ],
        dtype=np.float32,
    ).reshape(grid.rows, grid.cols)
    heat = np.uint8(np.clip(cell_confidence * 255, 0, 255))
    heat = cv2.applyColorMap(heat, cv2.COLORMAP_TURBO)
    heat = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB)
    heat[uncertain_mask] = (255, 0, 255)
    heat[empty_mask] = (215, 215, 215)
    board_width = max(1, int(round(grid.width)))
    board_height = max(1, int(round(grid.height)))
    heat = cv2.resize(
        heat, (board_width, board_height), interpolation=cv2.INTER_NEAREST
    )

    reconstructed = np.full_like(image_rgb, 255)
    for cell in cells:
        if cell.is_empty:
            continue
        left = int(round(x_edges[cell.col]))
        right = int(round(x_edges[cell.col + 1]))
        top = int(round(y_edges[cell.row]))
        bottom = int(round(y_edges[cell.row + 1]))
        color = tuple(int(cell.hex[index : index + 2], 16) for index in (1, 3, 5))
        reconstructed[top:bottom, left:right] = color
    difference = cv2.absdiff(image_rgb, reconstructed)
    difference[trusted_mask == 0] = 0

    return ExtractionArtifacts(
        grid_overlay=overlay,
        trusted_pixel_mask=trusted_mask,
        confidence_heatmap=heat,
        reconstructed=reconstructed,
        difference=difference,
        grid_line_mask=grid_line_mask,
        empty_cell_mask=np.uint8(empty_mask) * 255,
    )
