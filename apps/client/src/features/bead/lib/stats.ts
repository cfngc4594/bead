import { getMardColorIndex } from "@bead/core/colors";
import type { BeadFill } from "@/features/bead/types";

export type BeadStat = BeadFill & {
  count: number;
};

export function getBeadStats(beads: readonly (BeadFill | null)[]) {
  const statsByCode = new Map<string, BeadStat>();

  for (const bead of beads) {
    if (!bead) {
      continue;
    }

    const stat = statsByCode.get(bead.code);

    if (stat) {
      stat.count += 1;
      continue;
    }

    statsByCode.set(bead.code, {
      code: bead.code,
      hex: bead.hex,
      count: 1,
    });
  }

  return Array.from(statsByCode.values()).sort(compareBeadStats);
}

function compareBeadStats(a: BeadStat, b: BeadStat) {
  return getColorSortIndex(a.code) - getColorSortIndex(b.code);
}

function getColorSortIndex(code: string) {
  const index = getMardColorIndex(code);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
