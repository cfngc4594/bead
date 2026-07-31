from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from .cells import CellExtractionConfig, CellExtractionOutput

EmptyStrategy = Literal["baseline", "conflict-aware"]
BASELINE_EMPTY_ALGORITHM = "checker-mixture-v1"


@dataclass(frozen=True, slots=True)
class ConflictAwareEmptyConfig:
    """Parameters isolated from the frozen baseline empty classifier."""

    min_matching_neighbors: int = 3
    min_candidates: int = 24
    min_candidate_fraction: float = 0.01


def apply_empty_strategy(
    strategy: EmptyStrategy,
    output: CellExtractionOutput,
    rows: int,
    cols: int,
    cell_config: CellExtractionConfig,
    conflict_config: ConflictAwareEmptyConfig,
    *,
    image_local_palette_available: bool,
) -> dict[str, object]:
    """Apply a post-classification policy without changing baseline detection.

    ``baseline`` is intentionally a no-op.  It freezes the direct result of
    ``cells._detect_empty_cells`` so future experiments can always be compared
    against exactly the same decision path.
    """
    diagnostics: dict[str, object] = {
        "strategy": strategy,
        "baselineFrozen": True,
        "baselineAlgorithm": BASELINE_EMPTY_ALGORITHM,
        "applied": False,
        "candidateCells": 0,
        "recoveredCells": 0,
    }
    if strategy == "baseline":
        return diagnostics
    if strategy != "conflict-aware":
        raise ValueError(f"Unsupported empty strategy: {strategy}")
    if not image_local_palette_available:
        diagnostics["reason"] = "no-reliable-image-local-palette"
        return diagnostics

    empty = output.empty_mask.copy()
    if empty.shape != (rows, cols):
        diagnostics["reason"] = "shape-mismatch"
        return diagnostics
    codes = np.asarray([cell.code for cell in output.cells], dtype=object).reshape(
        rows, cols
    )
    candidates = np.zeros_like(empty, dtype=bool)
    for row in range(rows):
        for col in range(cols):
            if not empty[row, col]:
                continue
            matching_neighbors = 0
            for row_offset in (-1, 0, 1):
                for col_offset in (-1, 0, 1):
                    if row_offset == 0 and col_offset == 0:
                        continue
                    neighbor_row = row + row_offset
                    neighbor_col = col + col_offset
                    if not (0 <= neighbor_row < rows and 0 <= neighbor_col < cols):
                        continue
                    if (
                        not empty[neighbor_row, neighbor_col]
                        and codes[neighbor_row, neighbor_col] == codes[row, col]
                    ):
                        matching_neighbors += 1
            candidates[row, col] = (
                matching_neighbors >= conflict_config.min_matching_neighbors
            )

    candidate_count = int(np.count_nonzero(candidates))
    minimum_count = max(
        conflict_config.min_candidates,
        int(np.ceil(rows * cols * conflict_config.min_candidate_fraction)),
    )
    diagnostics.update(
        {
            "candidateCells": candidate_count,
            "minimumCandidateCells": minimum_count,
        }
    )
    if candidate_count < minimum_count:
        diagnostics["reason"] = "conflict-population-below-experimental-threshold"
        return diagnostics

    output.empty_mask[candidates] = False
    flat_candidates = candidates.ravel()
    flat_uncertain = output.uncertain_mask.ravel()
    for index in np.flatnonzero(flat_candidates):
        cell = output.cells[int(index)]
        cell.is_empty = False
        flat_uncertain[index] = (
            cell.distance > cell_config.max_delta_e
            or cell.margin < cell_config.min_margin
        )
    diagnostics.update(
        {
            "applied": True,
            "recoveredCells": candidate_count,
        }
    )
    return diagnostics
