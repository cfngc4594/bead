import {
  oklabDistance,
  type PaletteEntry,
} from "@/features/bead/lib/color-match";
import type { BeadFill } from "@/features/bead/types";

const cleanupMaxRegionSize = 3;
const cleanupDistanceThreshold = 9;

export function cleanupSmallRegions(
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
  palette: readonly PaletteEntry[],
) {
  const next = beads.map((bead) => (bead ? { ...bead } : null));
  const visited = new Uint8Array(next.length);
  const paletteByCode = new Map(palette.map((color) => [color.code, color]));

  for (let index = 0; index < next.length; index += 1) {
    const bead = next[index];

    if (!bead || visited[index]) {
      continue;
    }

    const region = collectRegion(next, visited, rows, cols, index, bead.code);

    if (region.length > cleanupMaxRegionSize) {
      continue;
    }

    const replacement = getBestNeighborReplacement(
      next,
      region,
      rows,
      cols,
      bead.code,
      paletteByCode,
    );

    if (!replacement) {
      continue;
    }

    for (const regionIndex of region) {
      next[regionIndex] = replacement;
    }
  }

  return next;
}

export function countTinyRegions(
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
  maxSize: number,
) {
  const visited = new Uint8Array(beads.length);
  let count = 0;

  for (let index = 0; index < beads.length; index += 1) {
    const bead = beads[index];

    if (!bead || visited[index]) {
      continue;
    }

    const region = collectRegion(beads, visited, rows, cols, index, bead.code);

    if (region.length <= maxSize) {
      count += 1;
    }
  }

  return count;
}

function collectRegion(
  beads: readonly (BeadFill | null)[],
  visited: Uint8Array,
  rows: number,
  cols: number,
  startIndex: number,
  code: string,
) {
  const region: number[] = [];
  const queue = [startIndex];
  visited[startIndex] = 1;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    region.push(index);

    for (const neighbor of getCardinalNeighbors(index, rows, cols)) {
      if (visited[neighbor] || beads[neighbor]?.code !== code) {
        continue;
      }

      visited[neighbor] = 1;
      queue.push(neighbor);
    }
  }

  return region;
}

function getBestNeighborReplacement(
  beads: readonly (BeadFill | null)[],
  region: readonly number[],
  rows: number,
  cols: number,
  originalCode: string,
  paletteByCode: ReadonlyMap<string, PaletteEntry>,
) {
  const original = paletteByCode.get(originalCode);

  if (!original) {
    return null;
  }

  const counts = new Map<string, { bead: BeadFill; count: number }>();
  const regionSet = new Set(region);

  for (const index of region) {
    for (const neighbor of getCardinalNeighbors(index, rows, cols)) {
      if (regionSet.has(neighbor)) {
        continue;
      }

      const bead = beads[neighbor];

      if (!bead) {
        continue;
      }

      const entry = counts.get(bead.code) ?? { bead, count: 0 };
      entry.count += 1;
      counts.set(bead.code, entry);
    }
  }

  return (
    [...counts.values()]
      .filter(({ bead }) => {
        const target = paletteByCode.get(bead.code);

        return (
          target &&
          oklabDistance(original.lab, target.lab) <= cleanupDistanceThreshold
        );
      })
      .sort((a, b) => b.count - a.count)[0]?.bead ?? null
  );
}

function getCardinalNeighbors(index: number, rows: number, cols: number) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors: number[] = [];

  if (row > 0) {
    neighbors.push(index - cols);
  }
  if (row < rows - 1) {
    neighbors.push(index + cols);
  }
  if (col > 0) {
    neighbors.push(index - 1);
  }
  if (col < cols - 1) {
    neighbors.push(index + 1);
  }

  return neighbors;
}
