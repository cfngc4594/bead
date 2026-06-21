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

export type BeadDocumentId = string;

export type BeadDocument = {
  id: BeadDocumentId;
  title: string;
  sizeId: CanvasSizeId;
  rows: number;
  cols: number;
  snapshots: BeadSnapshot[];
  currentIndex: number;
  updatedAt: number;
};

export const DEFAULT_BEAD_DOCUMENT_TITLE = "未命名作品";

export const beadDocumentsCollection = createCollection(
  localStorageCollectionOptions<BeadDocument, BeadDocumentId>({
    id: "bead-documents",
    storageKey: "bead:v3:documents",
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
  document: BeadDocument;
}) {
  return expandSnapshot(document.snapshots[document.currentIndex], cellCount);
}

export function canUndoDocument(document: BeadDocument) {
  return document.currentIndex > 0;
}

export function canRedoDocument(document: BeadDocument) {
  return document.currentIndex < document.snapshots.length - 1;
}

export function commitBeadSnapshot({
  baseIndex,
  beads,
  documentId,
}: {
  baseIndex?: number;
  beads: BeadState;
  documentId: BeadDocumentId;
}) {
  const document = getRequiredBeadDocument(documentId);

  const documentIndex = baseIndex ?? document.currentIndex;
  const nextSnapshot = compactBeads(beads);
  const currentSnapshot = document.snapshots[documentIndex];

  if (isSameSnapshot(currentSnapshot, nextSnapshot)) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.update(documentId, (draft) => {
      const branchIndex = Math.min(documentIndex, draft.snapshots.length - 1);
      const snapshots = draft.snapshots.slice(0, branchIndex + 1);

      snapshots.push(nextSnapshot);
      draft.snapshots = snapshots;
      draft.currentIndex = snapshots.length - 1;
      draft.updatedAt = Date.now();
    });
  });
}

export function undoBeadDocument(documentId: BeadDocumentId) {
  return moveBeadDocumentIndex(documentId, -1);
}

export function redoBeadDocument(documentId: BeadDocumentId) {
  return moveBeadDocumentIndex(documentId, 1);
}

export async function duplicateBeadDocument(documentId: BeadDocumentId) {
  const document = getRequiredBeadDocument(documentId);
  const duplicatedDocument: BeadDocument = {
    ...document,
    id: createBeadDocumentId(),
    snapshots: document.snapshots.map((snapshot) =>
      snapshot.map((cell) => ({ ...cell, fill: { ...cell.fill } })),
    ),
    updatedAt: Date.now(),
  };

  await commitBeadDocumentMutation(() => {
    beadDocumentsCollection.insert(duplicatedDocument);
  });

  return duplicatedDocument;
}

export function deleteBeadDocument(documentId: BeadDocumentId) {
  getRequiredBeadDocument(documentId);

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.delete(documentId);
  });
}

export function renameBeadDocument({
  documentId,
  title,
}: {
  documentId: BeadDocumentId;
  title: string;
}) {
  const document = getRequiredBeadDocument(documentId);

  const nextTitle =
    normalizeBeadDocumentTitle(title) || DEFAULT_BEAD_DOCUMENT_TITLE;

  if (document.title === nextTitle) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.update(documentId, (draft) => {
      draft.title = nextTitle;
      draft.updatedAt = Date.now();
    });
  });
}

export async function createBeadDocument(size: CanvasSize) {
  const document: BeadDocument = {
    id: createBeadDocumentId(),
    title: DEFAULT_BEAD_DOCUMENT_TITLE,
    sizeId: size.id,
    rows: size.rows,
    cols: size.cols,
    snapshots: [[]],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitBeadDocumentMutation(() => {
    beadDocumentsCollection.insert(document);
  });

  return document;
}

export function getBeadDocumentFilledCount(document: BeadDocument) {
  return document.snapshots[document.currentIndex].length;
}

function moveBeadDocumentIndex(documentId: BeadDocumentId, delta: -1 | 1) {
  const document = getRequiredBeadDocument(documentId);

  const nextIndex = document.currentIndex + delta;

  if (nextIndex < 0 || nextIndex >= document.snapshots.length) {
    return Promise.resolve();
  }

  return commitBeadDocumentMutation(() => {
    beadDocumentsCollection.update(documentId, (draft) => {
      draft.currentIndex = nextIndex;
      draft.updatedAt = Date.now();
    });
  });
}

function createBeadDocumentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRequiredBeadDocument(documentId: BeadDocumentId) {
  const document = beadDocumentsCollection.get(documentId);

  if (!document) {
    throw new Error(`Bead document not found: ${documentId}`);
  }

  return document;
}

function normalizeBeadDocumentTitle(title: string) {
  return title.trim().slice(0, 80);
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

function isSameSnapshot(a: BeadSnapshot, b: BeadSnapshot) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left.index !== right.index ||
      left.fill.code !== right.fill.code ||
      left.fill.hex !== right.fill.hex
    ) {
      return false;
    }
  }

  return true;
}
