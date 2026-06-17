"use client";

import { useEffect, useRef, useState } from "react";

import type { BeadFill } from "@/features/perler/types";

type BeadState = (BeadFill | null)[];

type CellChange = {
  index: number;
  before: BeadFill | null;
  after: BeadFill | null;
};

type HistoryEntry = {
  changes: CellChange[];
};

export function useBeadHistory(cellCount: number) {
  const [beads, setBeads] = useState<BeadState>(() =>
    Array.from({ length: cellCount }, () => null),
  );
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const draftRef = useRef<Map<number, CellChange> | null>(null);

  useEffect(() => {
    setBeads(Array.from({ length: cellCount }, () => null));
    setPast([]);
    setFuture([]);
    draftRef.current = null;
  }, [cellCount]);

  function beginEdit() {
    draftRef.current = new Map();
  }

  function editCell(index: number, nextValue: BeadFill | null) {
    setBeads((current) => {
      const previousValue = current[index] ?? null;

      if (isSameBead(previousValue, nextValue)) {
        return current;
      }

      const next = [...current];
      next[index] = nextValue;

      const draft = draftRef.current;

      if (!draft) {
        const entry = {
          changes: [{ index, before: previousValue, after: nextValue }],
        };

        setPast((entries) => [...entries, entry]);
        setFuture([]);
        return next;
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

      return next;
    });
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
      return;
    }

    setBeads((current) => applyChanges(current, entry, "before"));
    setPast((entries) => entries.slice(0, -1));
    setFuture((entries) => [entry, ...entries]);
  }

  function redo() {
    const entry = future[0];

    if (!entry) {
      return;
    }

    setBeads((current) => applyChanges(current, entry, "after"));
    setPast((entries) => [...entries, entry]);
    setFuture((entries) => entries.slice(1));
  }

  return {
    beads,
    beginEdit,
    editCell,
    commitEdit,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

function applyChanges(
  beads: BeadState,
  entry: HistoryEntry,
  direction: "before" | "after",
) {
  const next = [...beads];

  for (const change of entry.changes) {
    next[change.index] = change[direction];
  }

  return next;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
