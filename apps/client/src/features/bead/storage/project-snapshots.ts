import { mardColors } from "@/data/colors";
import {
  type BeadLayer,
  type CanvasDocumentState,
  type CanvasState,
  createEmptyCanvas,
} from "@/features/bead/lib/canvas-document";
import type { BeadFill } from "@/features/bead/types";
import type { CanvasSnapshot, CanvasSnapshotCell } from "./project-schema";

export function compactDocument(document: CanvasDocumentState): CanvasSnapshot {
  const layers = normalizeLayers(document);
  const cellLayerIndexes = getCellLayerIndexMap(layers);
  const cells = compactBeads(document.beads, cellLayerIndexes);

  return {
    cells,
    layers: layers.map(({ id, isHidden, isLocked, name }) => ({
      id,
      name,
      ...(isHidden ? { isHidden: true as const } : {}),
      ...(isLocked ? { isLocked: true as const } : {}),
    })),
    activeLayerId: getActiveLayerId(layers, document.activeLayerId),
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
  const layers = snapshot.layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    cellIndexes: [] as number[],
    isHidden: layer.isHidden === true,
    isLocked: layer.isLocked === true,
  }));

  if (layers.length === 0) {
    throw new Error("Cannot expand a snapshot without layers.");
  }

  for (const cell of snapshot.cells) {
    const index = cell[0];

    if (index < 0 || index >= cellCount) {
      throw new Error(`Snapshot cell index is outside the canvas: ${index}`);
    }

    const layerIndex = cell[2];

    if (!layers[layerIndex]) {
      throw new Error(
        `Snapshot cell layer index does not exist: ${layerIndex}`,
      );
    }

    beads[index] = getFillByCode(cell[1]);
    layers[layerIndex].cellIndexes.push(index);
  }

  return {
    beads,
    layers: layers.map((layer) => ({
      ...layer,
      cellIndexes: Array.from(new Set(layer.cellIndexes)).sort((a, b) => a - b),
    })),
    activeLayerId: getActiveLayerId(layers, snapshot.activeLayerId),
  };
}

export function getSnapshotFilledCount(snapshot: CanvasSnapshot) {
  return snapshot.cells.length;
}

function compactBeads(
  beads: CanvasState,
  cellLayerIndexes: Map<number, number>,
): CanvasSnapshotCell[] {
  const snapshot: CanvasSnapshotCell[] = [];

  for (let index = 0; index < beads.length; index += 1) {
    const fill = beads[index];

    if (fill) {
      const layerIndex = cellLayerIndexes.get(index);

      if (layerIndex === undefined) {
        throw new Error(`Filled cell is not assigned to a layer: ${index}`);
      }

      snapshot.push([index, fill.code, layerIndex]);
    }
  }

  return snapshot;
}

function normalizeLayers(document: CanvasDocumentState) {
  if (document.layers.length === 0) {
    throw new Error("Cannot compact a document without layers.");
  }

  const filledCellIndexes = new Set(
    document.beads
      .map((bead, index) => (bead ? index : null))
      .filter((index) => index !== null),
  );
  const claimedIndexes = new Set<number>();
  const layers = document.layers.map((layer) => {
    const name = layer.name.trim();

    if (!name) {
      throw new Error(`Layer name must not be empty: ${layer.id}`);
    }

    const cellIndexes = layer.cellIndexes.map((cellIndex) => {
      if (
        !Number.isInteger(cellIndex) ||
        cellIndex < 0 ||
        cellIndex >= document.beads.length
      ) {
        throw new Error(`Layer cell index is outside the canvas: ${cellIndex}`);
      }

      if (!filledCellIndexes.has(cellIndex)) {
        throw new Error(`Layer references an empty cell: ${cellIndex}`);
      }

      if (claimedIndexes.has(cellIndex)) {
        throw new Error(`Cell is assigned to multiple layers: ${cellIndex}`);
      }

      claimedIndexes.add(cellIndex);
      return cellIndex;
    });

    return {
      id: layer.id,
      name,
      cellIndexes,
      isHidden: layer.isHidden,
      isLocked: layer.isLocked,
    };
  });

  for (const cellIndex of filledCellIndexes) {
    if (!claimedIndexes.has(cellIndex)) {
      throw new Error(`Filled cell is not assigned to a layer: ${cellIndex}`);
    }
  }

  return layers.map((layer) => ({
    ...layer,
    cellIndexes: Array.from(new Set(layer.cellIndexes)).sort((a, b) => a - b),
  }));
}

function getActiveLayerId(layers: BeadLayer[], activeLayerId: string) {
  if (!layers.some((layer) => layer.id === activeLayerId)) {
    throw new Error(`Snapshot active layer does not exist: ${activeLayerId}`);
  }

  return activeLayerId;
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

  if (!color) {
    throw new Error(`Unknown bead color code: ${code}`);
  }

  return {
    code: color.code,
    hex: color.hex,
  };
}
