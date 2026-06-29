import { mardColors } from "@/data/colors";
import {
  type BeadLayer,
  type CanvasDocumentState,
  type CanvasState,
  createEmptyCanvas,
} from "@/features/bead/lib/canvas-document";
import type { BeadFill } from "@/features/bead/types";

export type CanvasSnapshotCell =
  | [index: number, code: string]
  | [index: number, code: string, layerIndex: number];

export type CanvasSnapshotLayer = {
  id: string;
  name: string;
  h?: 1;
  k?: 1;
};

export type CanvasSnapshot = {
  v: 2;
  c: CanvasSnapshotCell[];
  l: CanvasSnapshotLayer[];
  a: string;
};

export function compactDocument(document: CanvasDocumentState): CanvasSnapshot {
  const layers = normalizeLayers(document);
  const cellLayerIndexes = getCellLayerIndexMap(layers);
  const cells = compactBeads(document.beads, cellLayerIndexes);

  return {
    v: 2,
    c: cells,
    l: layers.map(({ id, isHidden, isLocked, name }) => ({
      id,
      name,
      ...(isHidden ? { h: 1 as const } : {}),
      ...(isLocked ? { k: 1 as const } : {}),
    })),
    a: getActiveLayerId(layers, document.activeLayerId),
  };
}

export function expandSnapshot({
  cellCount,
  snapshot,
}: {
  cellCount: number;
  snapshot: CanvasSnapshot;
}): CanvasDocumentState {
  const beads = createEmptyCanvas(cellCount);
  const layers = snapshot.l.map((layer) => ({
    id: layer.id,
    name: layer.name,
    cellIndexes: [] as number[],
    isHidden: layer.h === 1,
    isLocked: layer.k === 1,
  }));

  if (layers.length === 0) {
    layers.push({
      id: "layer-base",
      name: "图层 1",
      cellIndexes: [],
      isHidden: false,
      isLocked: false,
    });
  }

  for (const cell of snapshot.c) {
    const index = cell[0];

    if (index < 0 || index >= cellCount) {
      continue;
    }

    const layerIndex = layers[cell[2] ?? 0] ? (cell[2] ?? 0) : 0;

    beads[index] = getFillByCode(cell[1]);
    layers[layerIndex].cellIndexes.push(index);
  }

  return {
    beads,
    layers: layers.map((layer) => ({
      ...layer,
      cellIndexes: Array.from(new Set(layer.cellIndexes)).sort((a, b) => a - b),
    })),
    activeLayerId: getActiveLayerId(layers, snapshot.a),
  };
}

export function getSnapshotFilledCount(snapshot: CanvasSnapshot) {
  return snapshot.c.length;
}

function compactBeads(
  beads: CanvasState,
  cellLayerIndexes: Map<number, number>,
): CanvasSnapshotCell[] {
  const snapshot: CanvasSnapshotCell[] = [];

  for (let index = 0; index < beads.length; index += 1) {
    const fill = beads[index];

    if (fill) {
      const layerIndex = cellLayerIndexes.get(index) ?? 0;

      snapshot.push(
        layerIndex > 0 ? [index, fill.code, layerIndex] : [index, fill.code],
      );
    }
  }

  return snapshot;
}

function normalizeLayers(document: CanvasDocumentState) {
  const filledCellIndexes = new Set(
    document.beads
      .map((bead, index) => (bead ? index : null))
      .filter((index) => index !== null),
  );
  const claimedIndexes = new Set<number>();
  const layers = document.layers.map((layer, index) => {
    const cellIndexes = layer.cellIndexes.filter((cellIndex) => {
      if (
        cellIndex < 0 ||
        cellIndex >= document.beads.length ||
        !filledCellIndexes.has(cellIndex) ||
        claimedIndexes.has(cellIndex)
      ) {
        return false;
      }

      claimedIndexes.add(cellIndex);
      return true;
    });

    return {
      id: layer.id,
      name: layer.name.trim() || `图层 ${index + 1}`,
      cellIndexes,
      isHidden: layer.isHidden,
      isLocked: layer.isLocked,
    };
  });

  if (layers.length === 0) {
    layers.push({
      id: "layer-base",
      name: "图层 1",
      cellIndexes: [],
      isHidden: false,
      isLocked: false,
    });
  }

  for (const cellIndex of filledCellIndexes) {
    if (!claimedIndexes.has(cellIndex)) {
      layers[0].cellIndexes.push(cellIndex);
    }
  }

  return layers.map((layer) => ({
    ...layer,
    cellIndexes: Array.from(new Set(layer.cellIndexes)).sort((a, b) => a - b),
  }));
}

function getActiveLayerId(layers: BeadLayer[], activeLayerId: string) {
  return layers.some((layer) => layer.id === activeLayerId)
    ? activeLayerId
    : layers[0].id;
}

function getCellLayerIndexMap(layers: BeadLayer[]) {
  const cellLayerIndexes = new Map<number, number>();

  layers.forEach((layer, layerIndex) => {
    for (const cellIndex of layer.cellIndexes) {
      cellLayerIndexes.set(cellIndex, layerIndex);
    }
  });

  return cellLayerIndexes;
}

function getFillByCode(code: string): BeadFill {
  const color = mardColors.find((item) => item.code === code);

  if (color) {
    return {
      code: color.code,
      hex: color.hex,
    };
  }

  return {
    code,
    hex: "#000000",
  };
}
