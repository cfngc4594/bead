"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRef, useState } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type BeadDocumentId,
  type BeadState,
  beadDocumentsCollection,
  canRedoDocument,
  canUndoDocument,
  commitBeadSnapshot,
  createEmptyBeads,
  getCurrentBeads,
  redoBeadDocument,
  undoBeadDocument,
} from "@/features/bead/storage/bead-documents";
import type { BeadFill } from "@/features/bead/types";

export function useBeadSnapshots({
  documentId,
  size,
}: {
  documentId: BeadDocumentId;
  size: CanvasSize;
}) {
  const { data: documents = [] } = useLiveQuery(
    (query) =>
      query
        .from({ document: beadDocumentsCollection })
        .where(({ document }) => eq(document.id, documentId))
        .select(({ document }) => ({
          id: document.id,
          sizeId: document.sizeId,
          rows: document.rows,
          cols: document.cols,
          snapshots: document.snapshots,
          currentIndex: document.currentIndex,
          updatedAt: document.updatedAt,
        })),
    [documentId],
  );
  const document = documents[0];
  const cellCount = size.rows * size.cols;
  const persistedBeads = getCurrentBeads({ cellCount, document });
  const editBaseIndexRef = useRef<number | null>(null);
  const draftRef = useRef<BeadState | null>(null);
  const [draftBeads, setDraftBeads] = useState<BeadState | null>(null);
  const beads = draftBeads ?? persistedBeads;

  function beginEdit() {
    const currentDocument = beadDocumentsCollection.get(documentId) ?? document;

    editBaseIndexRef.current = currentDocument?.currentIndex ?? 0;
    draftRef.current = getCurrentBeads({
      cellCount,
      document: currentDocument,
    });
    setDraftBeads(draftRef.current);
  }

  function editCell(index: number, fill: BeadFill | null) {
    const next = [...(draftRef.current ?? beads)];

    if (isSameBead(next[index] ?? null, fill)) {
      return;
    }

    next[index] = fill;
    draftRef.current = next;
    setDraftBeads(next);
  }

  function commitEdit() {
    const draft = draftRef.current;
    const baseIndex = editBaseIndexRef.current;
    draftRef.current = null;
    editBaseIndexRef.current = null;

    if (!draft || isSameBeads(draft, persistedBeads)) {
      setDraftBeads(null);
      return;
    }

    persistBeadDocument(
      commitBeadSnapshot({
        baseIndex: baseIndex ?? undefined,
        beads: draft,
        documentId,
      }),
    );
    setDraftBeads(null);
  }

  function commitBeads(nextBeads: BeadState) {
    const currentDocument = beadDocumentsCollection.get(documentId) ?? document;
    const baseIndex = currentDocument?.currentIndex ?? 0;
    const currentBeads = getCurrentBeads({
      cellCount,
      document: currentDocument,
    });

    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);

    if (isSameBeads(nextBeads, currentBeads)) {
      return;
    }

    persistBeadDocument(
      commitBeadSnapshot({
        baseIndex,
        beads: [...nextBeads],
        documentId,
      }),
    );
  }

  function undo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);
    persistBeadDocument(undoBeadDocument(documentId));
  }

  function redo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);
    persistBeadDocument(redoBeadDocument(documentId));
  }

  function clear() {
    commitBeads(createEmptyBeads(cellCount));
  }

  return {
    beads,
    beginEdit,
    editCell,
    commitEdit,
    commitBeads,
    undo,
    redo,
    clear,
    canUndo: canUndoDocument(document),
    canRedo: canRedoDocument(document),
  };
}

function persistBeadDocument(persistence: Promise<unknown>) {
  persistence.catch((error) => {
    console.error("Unable to persist bead document", error);
  });
}

function isSameBeads(a: BeadState, b: BeadState) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (!isSameBead(a[index] ?? null, b[index] ?? null)) {
      return false;
    }
  }

  return true;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
