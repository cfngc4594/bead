import type { BeadFill } from "@/features/bead/types";

export type CanvasState = (BeadFill | null)[];

export type BeadLayer = {
  id: string;
  name: string;
  cellIndexes: number[];
  isHidden: boolean;
  isLocked: boolean;
};

export type CanvasDocumentState = {
  beads: CanvasState;
  layers: BeadLayer[];
  activeLayerId: string;
};

const DEFAULT_LAYER_ID = "layer-base";
const DEFAULT_LAYER_NAME = "图层 1";

export function createEmptyCanvas(cellCount: number): CanvasState {
  return Array.from({ length: cellCount }, () => null);
}

export function createEmptyDocument(cellCount: number): CanvasDocumentState {
  return createDocumentFromBeads(createEmptyCanvas(cellCount));
}

export function createDocumentFromBeads(
  beads: CanvasState,
): CanvasDocumentState {
  return {
    beads,
    layers: [
      {
        id: DEFAULT_LAYER_ID,
        name: DEFAULT_LAYER_NAME,
        cellIndexes: getFilledCellIndexes(beads),
        isHidden: false,
        isLocked: false,
      },
    ],
    activeLayerId: DEFAULT_LAYER_ID,
  };
}

export function cloneDocument(
  document: CanvasDocumentState,
): CanvasDocumentState {
  return {
    activeLayerId: document.activeLayerId,
    beads: document.beads.map((bead) => (bead ? { ...bead } : null)),
    layers: document.layers.map((layer) => ({
      ...layer,
      cellIndexes: [...layer.cellIndexes],
    })),
  };
}

export function addLayer(document: CanvasDocumentState): CanvasDocumentState {
  const layer = {
    id: createLayerId(),
    name: `图层 ${document.layers.length + 1}`,
    cellIndexes: [],
    isHidden: false,
    isLocked: false,
  };

  return {
    ...document,
    activeLayerId: layer.id,
    layers: [...document.layers, layer],
  };
}

export function selectLayer(
  document: CanvasDocumentState,
  layerId: string,
): CanvasDocumentState {
  if (
    document.activeLayerId === layerId ||
    !document.layers.some((layer) => layer.id === layerId)
  ) {
    return document;
  }

  return {
    ...document,
    activeLayerId: layerId,
  };
}

export function renameLayer({
  document,
  layerId,
  name,
}: {
  document: CanvasDocumentState;
  layerId: string;
  name: string;
}): CanvasDocumentState {
  const currentLayer = document.layers.find((layer) => layer.id === layerId);
  const nextName = normalizeLayerName(name) || currentLayer?.name || "图层";

  if (!currentLayer || currentLayer.name === nextName) {
    return document;
  }

  return {
    ...document,
    layers: document.layers.map((layer) =>
      layer.id === layerId ? { ...layer, name: nextName } : layer,
    ),
  };
}

export function toggleLayerHidden(
  document: CanvasDocumentState,
  layerId: string,
): CanvasDocumentState {
  return {
    ...document,
    layers: document.layers.map((layer) =>
      layer.id === layerId ? { ...layer, isHidden: !layer.isHidden } : layer,
    ),
  };
}

export function toggleLayerLocked(
  document: CanvasDocumentState,
  layerId: string,
): CanvasDocumentState {
  return {
    ...document,
    layers: document.layers.map((layer) =>
      layer.id === layerId ? { ...layer, isLocked: !layer.isLocked } : layer,
    ),
  };
}

export function deleteLayer(
  document: CanvasDocumentState,
  layerId: string,
): CanvasDocumentState {
  if (document.layers.length <= 1) {
    return document;
  }

  const deletedLayer = document.layers.find((layer) => layer.id === layerId);

  if (!deletedLayer) {
    return document;
  }

  const beads = [...document.beads];

  for (const cellIndex of deletedLayer.cellIndexes) {
    beads[cellIndex] = null;
  }

  const layers = document.layers.filter((layer) => layer.id !== layerId);

  return {
    beads,
    layers,
    activeLayerId:
      document.activeLayerId === layerId
        ? layers[0].id
        : document.activeLayerId,
  };
}

export function reorderLayer({
  document,
  fromIndex,
  toIndex,
}: {
  document: CanvasDocumentState;
  fromIndex: number;
  toIndex: number;
}): CanvasDocumentState {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= document.layers.length ||
    toIndex >= document.layers.length
  ) {
    return document;
  }

  const layers = [...document.layers];
  const [movedLayer] = layers.splice(fromIndex, 1);
  layers.splice(toIndex, 0, movedLayer);

  return {
    ...document,
    layers,
  };
}

export function clearDocumentBeads(
  document: CanvasDocumentState,
): CanvasDocumentState {
  return {
    ...document,
    beads: createEmptyCanvas(document.beads.length),
    layers: document.layers.map((layer) => ({ ...layer, cellIndexes: [] })),
  };
}

export function updateLayersForCell({
  activeLayerId,
  fill,
  index,
  layers,
}: {
  activeLayerId: string;
  fill: BeadFill | null;
  index: number;
  layers: BeadLayer[];
}) {
  return layers.map((layer) => {
    const cellIndexes = layer.cellIndexes.filter(
      (cellIndex) => cellIndex !== index,
    );

    if (fill && layer.id === activeLayerId) {
      cellIndexes.push(index);
      cellIndexes.sort((a, b) => a - b);
    }

    return { ...layer, cellIndexes };
  });
}

export function getVisibleBeads(document: CanvasDocumentState) {
  const hiddenCellIndexes = new Set<number>();

  for (const layer of document.layers) {
    if (!layer.isHidden) {
      continue;
    }

    for (const cellIndex of layer.cellIndexes) {
      hiddenCellIndexes.add(cellIndex);
    }
  }

  if (hiddenCellIndexes.size === 0) {
    return document.beads;
  }

  return document.beads.map((bead, index) =>
    hiddenCellIndexes.has(index) ? null : bead,
  );
}

export function getCellLayerIds(
  layers: readonly BeadLayer[],
  cellCount: number,
) {
  const cellLayerIds = Array.from(
    { length: cellCount },
    () => null as string | null,
  );

  for (const layer of layers) {
    for (const cellIndex of layer.cellIndexes) {
      if (cellIndex >= 0 && cellIndex < cellCount) {
        cellLayerIds[cellIndex] = layer.id;
      }
    }
  }

  return cellLayerIds;
}

export function getLayerByCellIndex(
  layers: readonly BeadLayer[],
  cellIndex: number,
) {
  return layers.find((layer) => layer.cellIndexes.includes(cellIndex)) ?? null;
}

export function isSameDocument(a: CanvasDocumentState, b: CanvasDocumentState) {
  return (
    a.activeLayerId === b.activeLayerId &&
    isSameBeads(a.beads, b.beads) &&
    isSameLayers(a.layers, b.layers)
  );
}

export function isSameBeads(a: CanvasState, b: CanvasState) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (!isSameBead(a[index] ?? null, b[index] ?? null)) {
      return false;
    }
  }

  return true;
}

export function normalizeLayerName(name: string) {
  return name.trim().slice(0, 32);
}

function createLayerId() {
  return crypto.randomUUID();
}

function getFilledCellIndexes(beads: CanvasState) {
  const cellIndexes: number[] = [];

  for (let index = 0; index < beads.length; index += 1) {
    if (beads[index]) {
      cellIndexes.push(index);
    }
  }

  return cellIndexes;
}

function isSameLayers(a: BeadLayer[], b: BeadLayer[]) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left.id !== right.id ||
      left.name !== right.name ||
      left.isHidden !== right.isHidden ||
      left.isLocked !== right.isLocked ||
      left.cellIndexes.length !== right.cellIndexes.length
    ) {
      return false;
    }

    for (
      let cellIndex = 0;
      cellIndex < left.cellIndexes.length;
      cellIndex += 1
    ) {
      if (left.cellIndexes[cellIndex] !== right.cellIndexes[cellIndex]) {
        return false;
      }
    }
  }

  return true;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
