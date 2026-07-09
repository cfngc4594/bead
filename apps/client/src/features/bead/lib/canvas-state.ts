import type { BeadFill } from "@/features/bead/types";

export type CanvasState = (BeadFill | null)[];

export function createEmptyCanvas(cellCount: number): CanvasState {
  return Array.from({ length: cellCount }, () => null);
}

export function cloneCanvas(beads: CanvasState): CanvasState {
  return beads.map((bead) => (bead ? { ...bead } : null));
}

export function isSameCanvas(a: CanvasState, b: CanvasState) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (!isSameBead(a[index], b[index])) {
      return false;
    }
  }

  return true;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
