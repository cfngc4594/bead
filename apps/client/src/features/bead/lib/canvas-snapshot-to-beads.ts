import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { getMardColor } from "@bead/core/colors";
import {
  type CanvasState,
  createEmptyCanvas,
} from "@/features/bead/lib/canvas-state";

export function canvasSnapshotToBeads(
  snapshot: CanvasSnapshot,
  cellCount: number,
): CanvasState {
  const beads = createEmptyCanvas(cellCount);

  for (const [index, code] of snapshot.cells) {
    if (index < 0 || index >= cellCount) {
      throw new Error(`Canvas snapshot index is out of range: ${index}`);
    }

    const color = getMardColor(code);
    if (!color) {
      throw new Error(`Canvas snapshot contains an unknown color: ${code}`);
    }

    beads[index] = { code: color.code, hex: color.hex };
  }

  return beads;
}
