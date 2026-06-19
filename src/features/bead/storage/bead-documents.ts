import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import type { CanvasSize, CanvasSizeId } from "@/config/canvas-sizes";
import type { BeadFill } from "@/features/bead/types";

export type BeadState = (BeadFill | null)[];

export type BeadSnapshotCell = {
  index: number;
  fill: BeadFill;
};

export type BeadSnapshot = BeadSnapshotCell[];

export type BeadDocument = {
  id: CanvasSizeId;
  sizeId: CanvasSizeId;
  rows: number;
  cols: number;
  snapshots: BeadSnapshot[];
  currentIndex: number;
  updatedAt: number;
};

export const beadDocumentsCollection = createCollection(
  localStorageCollectionOptions<BeadDocument, CanvasSizeId>({
    id: "bead-documents",
    storageKey: "bead:v2:documents",
    getKey: (document) => document.id,
  }),
);

export function createEmptyBeads(cellCount: number): BeadState {
  return Array.from({ length: cellCount }, () => null);
}

export function getCurrentBeads({
  cellCount,
  document,
}: {
  cellCount: number;
  document: BeadDocument | undefined;
}) {
  if (!document) {
    return createEmptyBeads(cellCount);
  }

  return expandSnapshot(
    document.snapshots[document.currentIndex] ?? [],
    cellCount,
  );
}

export function canUndoDocument(document: BeadDocument | undefined) {
  return (document?.currentIndex ?? 0) > 0;
}

export function canRedoDocument(document: BeadDocument | undefined) {
  if (!document) {
    return false;
  }

  return document.currentIndex < document.snapshots.length - 1;
}

export function commitBeadSnapshot({
  baseIndex,
  beads,
  size,
}: {
  baseIndex?: number;
  beads: BeadState;
  size: CanvasSize;
}) {
  const document = beadDocumentsCollection.get(size.id);
  const documentIndex = baseIndex ?? document?.currentIndex ?? 0;
  const nextSnapshot = compactBeads(beads);
  const currentSnapshot = document?.snapshots[documentIndex] ?? [];

  if (isSameSnapshot(currentSnapshot, nextSnapshot)) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    getOrCreateDocument(size);

    beadDocumentsCollection.update(size.id, (draft) => {
      const branchIndex = Math.min(documentIndex, draft.snapshots.length - 1);
      const snapshots = draft.snapshots.slice(0, branchIndex + 1);

      snapshots.push(nextSnapshot);
      draft.snapshots = snapshots;
      draft.currentIndex = snapshots.length - 1;
      draft.updatedAt = Date.now();
    });
  });
}

export function undoBeadDocument(size: CanvasSize) {
  return moveBeadDocumentIndex(size, -1);
}

export function redoBeadDocument(size: CanvasSize) {
  return moveBeadDocumentIndex(size, 1);
}

export function clearBeadDocument(size: CanvasSize) {
  const document = beadDocumentsCollection.get(size.id);

  if (!document || isEmptyDocument(document)) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.update(size.id, (draft) => {
      draft.snapshots = [[]];
      draft.currentIndex = 0;
      draft.updatedAt = Date.now();
    });
  });
}

function moveBeadDocumentIndex(size: CanvasSize, delta: -1 | 1) {
  const document = beadDocumentsCollection.get(size.id);

  if (!document) {
    return Promise.resolve();
  }

  const nextIndex = document.currentIndex + delta;

  if (nextIndex < 0 || nextIndex >= document.snapshots.length) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.update(size.id, (draft) => {
      draft.currentIndex = nextIndex;
      draft.updatedAt = Date.now();
    });
  });
}

function getOrCreateDocument(size: CanvasSize) {
  const existing = beadDocumentsCollection.get(size.id);

  if (existing) {
    return existing;
  }

  const document: BeadDocument = {
    id: size.id,
    sizeId: size.id,
    rows: size.rows,
    cols: size.cols,
    snapshots: [[]],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  beadDocumentsCollection.insert(document);
  return document;
}

function commitBeadDocumentMutation(mutator: () => void) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction }) => {
      beadDocumentsCollection.utils.acceptMutations(transaction);
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}

function compactBeads(beads: BeadState): BeadSnapshot {
  const snapshot: BeadSnapshot = [];

  for (let index = 0; index < beads.length; index += 1) {
    const fill = beads[index];

    if (fill) {
      snapshot.push({ index, fill });
    }
  }

  return snapshot;
}

function expandSnapshot(snapshot: BeadSnapshot, cellCount: number): BeadState {
  const beads = createEmptyBeads(cellCount);

  for (const cell of snapshot) {
    if (cell.index >= 0 && cell.index < cellCount) {
      beads[cell.index] = cell.fill;
    }
  }

  return beads;
}

function isEmptyDocument(document: BeadDocument) {
  return (
    document.currentIndex === 0 &&
    document.snapshots.length === 1 &&
    document.snapshots[0]?.length === 0
  );
}

function isSameSnapshot(a: BeadSnapshot, b: BeadSnapshot) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left?.index !== right?.index ||
      left.fill.code !== right.fill.code ||
      left.fill.hex !== right.fill.hex
    ) {
      return false;
    }
  }

  return true;
}
