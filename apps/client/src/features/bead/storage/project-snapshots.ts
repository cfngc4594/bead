import type {
  CanvasSnapshot,
  CanvasSnapshotCell,
} from "@bead/core/canvas-snapshot";
import {
  DEFAULT_COLOR_SCHEME_ID,
  getBeadColor,
  getRequiredColorScheme,
} from "@bead/core/colors";
import {
  type CanvasState,
  createEmptyCanvas,
} from "@/features/bead/lib/canvas-state";
import type { BeadFill } from "@/features/bead/types";

export function compactCanvas(
  beads: CanvasState,
  colorSchemeId = DEFAULT_COLOR_SCHEME_ID,
): CanvasSnapshot {
  const colorScheme = getRequiredColorScheme(colorSchemeId);

  return {
    colorSchemeId: colorScheme.id,
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
  const colorSchemeId = snapshot.colorSchemeId ?? DEFAULT_COLOR_SCHEME_ID;

  for (const cell of snapshot.cells) {
    const index = cell[0];

    if (index < 0 || index >= cellCount) {
      throw new Error(`Snapshot cell index is outside the canvas: ${index}`);
    }

    beads[index] = getFillByCode(colorSchemeId, cell[1]);
  }

  return beads;
}

export function getSnapshotFilledCount(snapshot: CanvasSnapshot) {
  return snapshot.cells.length;
}

export function cloneSnapshot(snapshot: CanvasSnapshot): CanvasSnapshot {
  const colorScheme = getRequiredColorScheme(
    snapshot.colorSchemeId ?? DEFAULT_COLOR_SCHEME_ID,
  );

  return {
    colorSchemeId: colorScheme.id,
    cells: snapshot.cells.map(([index, code]) => [index, code]),
  };
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

function getFillByCode(colorSchemeId: string, code: string): BeadFill {
  const color = getBeadColor(colorSchemeId, code);

  if (!color) {
    throw new Error(
      `Unknown bead color code for scheme ${colorSchemeId}: ${code}`,
    );
  }

  return {
    code: color.code,
    hex: color.hex,
  };
}
