from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np


@dataclass(frozen=True, slots=True)
class PaletteColor:
    code: str
    hex: str
    rgb: tuple[int, int, int]
    canonical_code: str


@dataclass(frozen=True, slots=True)
class GridGeometry:
    left: float
    top: float
    right: float
    bottom: float
    rows: int
    cols: int
    pitch_x: float
    pitch_y: float
    confidence: float
    diagnostics: dict[str, Any] = field(default_factory=dict)
    x_edges: tuple[float, ...] | None = None
    y_edges: tuple[float, ...] | None = None
    x_line_widths: tuple[float, ...] | None = None
    y_line_widths: tuple[float, ...] | None = None
    x_line_confidences: tuple[float, ...] | None = None
    y_line_confidences: tuple[float, ...] | None = None

    @property
    def width(self) -> float:
        return self.right - self.left

    @property
    def height(self) -> float:
        return self.bottom - self.top

    def column_edges(self) -> np.ndarray:
        if self.x_edges is not None:
            return np.asarray(self.x_edges, dtype=np.float64)
        return np.linspace(self.left, self.right, self.cols + 1)

    def row_edges(self) -> np.ndarray:
        if self.y_edges is not None:
            return np.asarray(self.y_edges, dtype=np.float64)
        return np.linspace(self.top, self.bottom, self.rows + 1)

    def column_line_widths(self) -> np.ndarray:
        if self.x_line_widths is not None:
            return np.asarray(self.x_line_widths, dtype=np.float64)
        return np.ones(self.cols + 1, dtype=np.float64)

    def row_line_widths(self) -> np.ndarray:
        if self.y_line_widths is not None:
            return np.asarray(self.y_line_widths, dtype=np.float64)
        return np.ones(self.rows + 1, dtype=np.float64)


@dataclass(slots=True)
class CellEstimate:
    row: int
    col: int
    observed_rgb: np.ndarray
    code: str
    hex: str
    distance: float
    second_distance: float
    trusted_pixels: int
    is_empty: bool = False
    empty_confidence: float = 0.0

    @property
    def margin(self) -> float:
        return self.second_distance - self.distance


@dataclass(slots=True)
class ExtractionArtifacts:
    grid_overlay: np.ndarray
    trusted_pixel_mask: np.ndarray
    confidence_heatmap: np.ndarray
    reconstructed: np.ndarray
    difference: np.ndarray
    grid_line_mask: np.ndarray | None = None
    empty_cell_mask: np.ndarray | None = None


@dataclass(slots=True)
class ExtractionResult:
    accepted: bool
    template: dict[str, Any]
    report: dict[str, Any]
    grid: GridGeometry
    cells: list[CellEstimate]
    artifacts: ExtractionArtifacts
    output_directory: Path | None = None
