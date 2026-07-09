import { mardColors } from "@/data/colors";
import {
  type CanvasState,
  createEmptyCanvas,
} from "@/features/bead/lib/canvas-state";
import type { BeadFill } from "@/features/bead/types";
import type { CanvasSnapshot, CanvasSnapshotCell } from "./project-schema";

export function compactCanvas(beads: CanvasState): CanvasSnapshot {
  return {
    cells: compactBeads(beads),
  };
}

export function expandSnapshot({
  cellCount,
  snapshot,
}: {
  cellCount: number;
  snapshot: CanvasSnapshot;
}): CanvasState {
  const beads = createEmptyCanvas(cellCount);

  for (const cell of snapshot.cells) {
    const index = cell[0];

    if (index < 0 || index >= cellCount) {
      throw new Error(`Snapshot cell index is outside the canvas: ${index}`);
    }

    beads[index] = getFillByCode(cell[1]);
  }

  return beads;
}

export function getSnapshotFilledCount(snapshot: CanvasSnapshot) {
  return snapshot.cells.length;
}

function compactBeads(beads: CanvasState): CanvasSnapshotCell[] {
  const snapshot: CanvasSnapshotCell[] = [];

  for (let index = 0; index < beads.length; index += 1) {
    const fill = beads[index];

    if (fill) {
      snapshot.push([index, fill.code]);
    }
  }

  return snapshot;
}

function getFillByCode(code: string): BeadFill {
  const color = mardColors.find((item) => item.code === code);

  if (!color) {
    throw new Error(`Unknown bead color code: ${code}`);
  }

  return {
    code: color.code,
    hex: color.hex,
  };
}
