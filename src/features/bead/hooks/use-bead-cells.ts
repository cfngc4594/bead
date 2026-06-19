"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import type { CanvasSize } from "@/config/canvas-sizes";
import type { BeadCellChange } from "@/features/bead/hooks/use-bead-history";
import {
  applyBeadCellChanges,
  beadCellsCollection,
  clearBeadCells,
  getBeadsForSize,
} from "@/features/bead/storage/bead-cells";

export function useBeadCells(size: CanvasSize) {
  const { data: cells = [] } = useLiveQuery(
    (query) =>
      query
        .from({ cell: beadCellsCollection })
        .where(({ cell }) => eq(cell.sizeId, size.id))
        .select(({ cell }) => ({
          id: cell.id,
          sizeId: cell.sizeId,
          index: cell.index,
          fill: cell.fill,
        })),
    [size.id],
  );
  const beads = getBeadsForSize({
    cells,
    cellCount: size.rows * size.cols,
    sizeId: size.id,
  });

  function applyChanges(
    changes: BeadCellChange[],
    direction: "before" | "after",
  ) {
    if (changes.length === 0) {
      return;
    }

    persistBeadCells(
      applyBeadCellChanges({
        changes,
        direction,
        sizeId: size.id,
      }),
    );
  }

  function clearCells() {
    if (cells.length === 0) {
      return;
    }

    persistBeadCells(clearBeadCells(size.id, cells));
  }

  return {
    beads,
    applyChanges,
    clearCells,
  };
}

function persistBeadCells(persistence: Promise<unknown>) {
  persistence.catch((error) => {
    console.error("Unable to persist bead cells", error);
  });
}
