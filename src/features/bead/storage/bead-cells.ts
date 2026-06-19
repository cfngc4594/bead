import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import type { CanvasSizeId } from "@/config/canvas-sizes";
import type { BeadFill } from "@/features/bead/types";

export type BeadCell = {
  id: string;
  sizeId: CanvasSizeId;
  index: number;
  fill: BeadFill;
};

export type BeadCellChange = {
  index: number;
  before: BeadFill | null;
  after: BeadFill | null;
};

export const beadCellsCollection = createCollection(
  localStorageCollectionOptions<BeadCell, string>({
    id: "bead-cells",
    storageKey: "bead:cells",
    getKey: (cell) => cell.id,
  }),
);

export function getBeadsForSize({
  cells,
  cellCount,
  sizeId,
}: {
  cells: BeadCell[];
  cellCount: number;
  sizeId: CanvasSizeId;
}) {
  const beads = Array.from(
    { length: cellCount },
    () => null as BeadFill | null,
  );

  for (const cell of cells) {
    if (cell.sizeId === sizeId && cell.index >= 0 && cell.index < cellCount) {
      beads[cell.index] = cell.fill;
    }
  }

  return beads;
}

export function applyBeadCellChanges({
  changes,
  direction,
  sizeId,
}: {
  changes: BeadCellChange[];
  direction: "before" | "after";
  sizeId: CanvasSizeId;
}) {
  return commitBeadCellMutations(() => {
    for (const change of changes) {
      writeBeadCell(sizeId, change.index, change[direction]);
    }
  });
}

export function clearBeadCells(sizeId: CanvasSizeId, cells: BeadCell[]) {
  return commitBeadCellMutations(() => {
    for (const cell of cells) {
      if (cell.sizeId === sizeId) {
        beadCellsCollection.delete(cell.id);
      }
    }
  });
}

function commitBeadCellMutations(mutator: () => void) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction }) => {
      beadCellsCollection.utils.acceptMutations(transaction);
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}

function writeBeadCell(
  sizeId: CanvasSizeId,
  index: number,
  fill: BeadFill | null,
) {
  const id = getBeadCellId(sizeId, index);

  if (!fill) {
    if (!beadCellsCollection.has(id)) {
      return;
    }

    beadCellsCollection.delete(id);
    return;
  }

  if (beadCellsCollection.has(id)) {
    beadCellsCollection.update(id, (draft) => {
      draft.fill = fill;
    });
    return;
  }

  beadCellsCollection.insert({
    id,
    sizeId,
    index,
    fill,
  });
}

function getBeadCellId(sizeId: CanvasSizeId, index: number) {
  return `${sizeId}:${index}`;
}
