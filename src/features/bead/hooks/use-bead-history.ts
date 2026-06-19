"use client";

import { useRef, useState } from "react";

import type { BeadFill } from "@/features/bead/types";

type BeadState = (BeadFill | null)[];

export type BeadCellChange = {
  index: number;
  before: BeadFill | null;
  after: BeadFill | null;
};

type HistoryEntry = {
  changes: BeadCellChange[];
};

export function useBeadHistory(beads: BeadState) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const draftRef = useRef<Map<number, BeadCellChange> | null>(null);

  function beginEdit() {
    draftRef.current = new Map();
  }

  function editCell(index: number, nextValue: BeadFill | null) {
    const previousValue = beads[index] ?? null;

    if (isSameBead(previousValue, nextValue)) {
      return [];
    }

    const draft = draftRef.current;

    if (!draft) {
      const change = { index, before: previousValue, after: nextValue };
      setPast((entries) => [...entries, { changes: [change] }]);
      setFuture([]);
      return [change];
    }

    const existing = draft.get(index);

    if (existing) {
      existing.after = nextValue;

      if (isSameBead(existing.before, existing.after)) {
        draft.delete(index);
      }
    } else {
      draft.set(index, { index, before: previousValue, after: nextValue });
    }

    return [{ index, before: previousValue, after: nextValue }];
  }

  function commitEdit() {
    const draft = draftRef.current;
    draftRef.current = null;

    if (!draft?.size) {
      return;
    }

    setPast((entries) => [...entries, { changes: Array.from(draft.values()) }]);
    setFuture([]);
  }

  function undo() {
    const entry = past.at(-1);

    if (!entry) {
      return [];
    }

    setPast((entries) => entries.slice(0, -1));
    setFuture((entries) => [entry, ...entries]);
    return entry.changes;
  }

  function redo() {
    const entry = future[0];

    if (!entry) {
      return [];
    }

    setPast((entries) => [...entries, entry]);
    setFuture((entries) => entries.slice(1));
    return entry.changes;
  }

  function resetHistory() {
    setPast([]);
    setFuture([]);
    draftRef.current = null;
  }

  return {
    beginEdit,
    editCell,
    commitEdit,
    undo,
    redo,
    resetHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
