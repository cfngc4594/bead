import type { CanvasView, GridCell, Viewport } from "@/features/bead/types";

export const cellSize = 18;
export const boardPadding = 24;
export const labelCells = 1;
export const boardOrigin = cellSize * labelCells;
const maxFitScale = 2.5;

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
}: {
  view: CanvasView;
  point: { x: number; y: number };
  deltaY: number;
}): CanvasView {
  const scaleBy = 1.08;
  const nextScale = deltaY > 0 ? view.scale / scaleBy : view.scale * scaleBy;
  const scale = Math.min(3, Math.max(0.35, nextScale));
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

function getInitialScale(rows: number, cols: number, viewport: Viewport) {
  const board = getBoardSize(rows, cols);
  const availableWidth = viewport.width - boardPadding * 2;
  const availableHeight = viewport.height - boardPadding * 2;

  return Math.min(
    maxFitScale,
    availableWidth / board.width,
    availableHeight / board.height,
  );
}
