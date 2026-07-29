import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { getMardColor } from "@bead/core/colors";
import type { BeadFill } from "@/features/bead/types";

export function canvasSnapshotToBeads(
  snapshot: CanvasSnapshot,
  cellCount: number,
): (BeadFill | null)[] {
  const beads: (BeadFill | null)[] = Array.from(
    { length: cellCount },
    () => null,
  );

  for (const [index, code] of snapshot.cells) {
    if (index < 0 || index >= cellCount) {
      continue;
    }

    const color = getMardColor(code);
    if (!color) {
      continue;
    }

    beads[index] = { code: color.code, hex: color.hex };
  }

  return beads;
}
