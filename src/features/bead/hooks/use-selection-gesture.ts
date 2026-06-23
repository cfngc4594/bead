"use client";

import { useEffect, useRef, useState } from "react";
import {
  type BeadSelection,
  type BeadSelectionBox,
  getMovedSelectionOrigin,
  getSelectionFromBox,
  hideSelectedBeads,
  isCellInSelection,
  isSameCell,
  isSelectionInBounds,
  moveSelectedBeads,
} from "@/features/bead/lib/selection";
import type { BeadFill, GridCell } from "@/features/bead/types";

export function useSelectionGesture({
  beads,
  cols,
  onMoveSelection,
  resetSignal,
  rows,
}: {
  beads: readonly (BeadFill | null)[];
  cols: number;
  onMoveSelection: (beads: (BeadFill | null)[]) => void;
  resetSignal: number;
  rows: number;
}) {
  const handledResetSignalRef = useRef(resetSignal);
  const [selection, setSelection] = useState<BeadSelection | null>(null);
  const [selectionBox, setSelectionBox] = useState<BeadSelectionBox | null>(
    null,
  );
  const [moveStartCell, setMoveStartCell] = useState<GridCell | null>(null);
  const [moveTargetOrigin, setMoveTargetOrigin] = useState<GridCell | null>(
    null,
  );
  const displayedBeads =
    selection && moveTargetOrigin
      ? hideSelectedBeads(beads, selection, cols)
      : beads;

  useEffect(() => {
    if (resetSignal === handledResetSignalRef.current) {
      return;
    }

    handledResetSignalRef.current = resetSignal;
    setSelection(null);
    setSelectionBox(null);
    setMoveStartCell(null);
    setMoveTargetOrigin(null);
  }, [resetSignal]);

  function clearGesture() {
    setSelectionBox(null);
    setMoveStartCell(null);
    setMoveTargetOrigin(null);
  }

  function beginSelection(cell: GridCell | null) {
    if (!cell) {
      setSelection(null);
      return;
    }

    if (selection && isCellInSelection(cell, selection)) {
      setMoveStartCell(cell);
      setMoveTargetOrigin(selection.origin);
      return;
    }

    setSelection(null);
    setSelectionBox({ start: cell, end: cell });
  }

  function updateSelection(cell: GridCell | null) {
    if (!cell) {
      return;
    }

    if (selectionBox) {
      setSelectionBox((current) =>
        current ? { ...current, end: cell } : current,
      );
      return;
    }

    if (selection && moveStartCell) {
      setMoveTargetOrigin(
        getMovedSelectionOrigin(selection, moveStartCell, cell),
      );
    }
  }

  function finishSelection() {
    if (selectionBox) {
      const nextSelection = getSelectionFromBox(
        selectionBox,
        beads,
        rows,
        cols,
      );

      setSelection(nextSelection);
      setSelectionBox(null);
      return;
    }

    if (selection && moveStartCell && moveTargetOrigin) {
      if (
        isSelectionInBounds(selection, moveTargetOrigin, rows, cols) &&
        !isSameCell(selection.origin, moveTargetOrigin)
      ) {
        onMoveSelection(
          moveSelectedBeads(beads, selection, moveTargetOrigin, cols),
        );
        setSelection({
          ...selection,
          origin: moveTargetOrigin,
        });
      }

      setMoveStartCell(null);
      setMoveTargetOrigin(null);
    }
  }

  return {
    beginSelection,
    clearGesture,
    displayedBeads,
    finishSelection,
    isMovingSelection: Boolean(moveStartCell),
    moveTargetOrigin,
    selection,
    selectionBox,
    updateSelection,
  };
}
