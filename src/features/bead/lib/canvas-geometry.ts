import type { CanvasView, GridCell, Viewport } from "@/features/bead/types";

export const cellSize = 18;
export const boardPadding = 24;
export const labelCells = 1;
export const boardOrigin = cellSize * labelCells;
const maxFitScale = 2.5;
export const maxZoomScale = 3;

export function getBoardSize(rows: number, cols: number) {
  return {
    width: (cols + labelCells * 2) * cellSize,
    height: (rows + labelCells * 2) * cellSize,
  };
}

export function getGridOrigin() {
  return {
    x: boardOrigin,
    y: boardOrigin,
  };
}

export function getInitialView(rows: number, cols: number, viewport: Viewport) {
  const scale = getInitialScale(rows, cols, viewport);
  const board = getBoardSize(rows, cols);
  const width = board.width * scale;
  const height = board.height * scale;

  return {
    scale,
    x: Math.max(boardPadding, (viewport.width - width) / 2),
    y: Math.max(boardPadding, (viewport.height - height) / 2),
  };
}

export function getGridCellFromPoint({
  point,
  view,
  rows,
  cols,
}: {
  point: { x: number; y: number };
  view: CanvasView;
  rows: number;
  cols: number;
}): GridCell | null {
  const origin = getGridOrigin();
  const localX = (point.x - view.x) / view.scale - origin.x;
  const localY = (point.y - view.y) / view.scale - origin.y;
  const column = Math.floor(localX / cellSize);
  const row = Math.floor(localY / cellSize);

  if (row < 0 || row >= rows || column < 0 || column >= cols) {
    return null;
  }

  return { row, column };
}

export function getZoomedView({
  view,
  point,
  deltaY,
  minScale,
}: {
  view: CanvasView;
  point: { x: number; y: number };
  deltaY: number;
  minScale: number;
}): CanvasView {
  const scaleBy = 1.08;
  const scale =
    deltaY > 0
      ? clampZoomScale(view.scale / scaleBy, minScale)
      : clampZoomScale(view.scale * scaleBy, minScale);
  const pointOnBoard = {
    x: (point.x - view.x) / view.scale,
    y: (point.y - view.y) / view.scale,
  };

  return {
    scale,
    x: point.x - pointOnBoard.x * scale,
    y: point.y - pointOnBoard.y * scale,
  };
}

export function getPinchedView({
  view,
  previousCenter,
  nextCenter,
  scaleFactor,
  minScale,
}: {
  view: CanvasView;
  previousCenter: { x: number; y: number };
  nextCenter: { x: number; y: number };
  scaleFactor: number;
  minScale: number;
}): CanvasView {
  const scale = clampZoomScale(view.scale * scaleFactor, minScale);
  const pointOnBoard = {
    x: (previousCenter.x - view.x) / view.scale,
    y: (previousCenter.y - view.y) / view.scale,
  };

  return {
    scale,
    x: nextCenter.x - pointOnBoard.x * scale,
    y: nextCenter.y - pointOnBoard.y * scale,
  };
}

export function getInitialScale(
  rows: number,
  cols: number,
  viewport: Viewport,
) {
  const board = getBoardSize(rows, cols);
  const availableWidth = viewport.width - boardPadding * 2;
  const availableHeight = viewport.height - boardPadding * 2;

  return Math.min(
    maxFitScale,
    availableWidth / board.width,
    availableHeight / board.height,
  );
}

function clampZoomScale(scale: number, minScale: number) {
  return Math.min(maxZoomScale, Math.max(minScale, scale));
}
