import type { Context } from "konva/lib/Context";
import type { BoardTheme } from "@/features/bead/lib/board-theme";
import { boardDrawingPalettes } from "@/features/bead/lib/board-theme-colors";
import {
  cellSize,
  cellVisualCenterOffset,
  getGridOrigin,
  gridLineOffset,
} from "@/features/bead/lib/canvas-geometry";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";
import type { BeadFill, CanvasView, Viewport } from "@/features/bead/types";

const maxLabelTexturePixelRatio = 8;

type DrawingContext = Pick<
  Context,
  | "beginPath"
  | "drawImage"
  | "fillStyle"
  | "fillText"
  | "font"
  | "imageSmoothingEnabled"
  | "lineTo"
  | "lineWidth"
  | "moveTo"
  | "restore"
  | "save"
  | "stroke"
  | "strokeStyle"
  | "textAlign"
  | "textBaseline"
>;

type LabelGridContext = DrawingContext & Pick<Context, "lineCap">;

export function syncBeadTexture({
  beads,
  canvas,
  cols,
  previousBeads,
  rows,
}: {
  beads: readonly (BeadFill | null)[];
  canvas: HTMLCanvasElement;
  cols: number;
  previousBeads: readonly (BeadFill | null)[] | null;
  rows: number;
}) {
  const resized = canvas.width !== cols || canvas.height !== rows;

  if (resized) {
    canvas.width = cols;
    canvas.height = rows;
  }

  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return 0;
  }

  let changedCount = 0;

  for (let index = 0; index < rows * cols; index += 1) {
    const bead = beads[index] ?? null;
    const previous = resized ? null : (previousBeads?.[index] ?? null);

    if (!resized && isSameBead(bead, previous)) {
      continue;
    }

    const column = index % cols;
    const row = Math.floor(index / cols);
    changedCount += 1;

    if (bead) {
      context.fillStyle = bead.hex;
      context.fillRect(column, row, 1, 1);
    } else {
      context.clearRect(column, row, 1, 1);
    }
  }

  return changedCount;
}

export function drawBeadTexture(
  context: DrawingContext,
  texture: HTMLCanvasElement,
  rows: number,
  cols: number,
) {
  const origin = getGridOrigin();

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    texture,
    0,
    0,
    cols,
    rows,
    origin.x,
    origin.y,
    cols * cellSize,
    rows * cellSize,
  );
  context.restore();
}

export function drawGridLines(
  context: DrawingContext,
  rows: number,
  cols: number,
  theme: BoardTheme,
) {
  const origin = getGridOrigin();
  const width = cols * cellSize;
  const height = rows * cellSize;

  context.beginPath();
  context.strokeStyle = boardDrawingPalettes[theme].grid;
  context.lineWidth = 1;

  for (let column = 0; column <= cols; column += 1) {
    const x = origin.x + column * cellSize + gridLineOffset;
    context.moveTo(x, origin.y + gridLineOffset);
    context.lineTo(x, origin.y + height + gridLineOffset);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = origin.y + row * cellSize + gridLineOffset;
    context.moveTo(origin.x + gridLineOffset, y);
    context.lineTo(origin.x + width + gridLineOffset, y);
  }

  context.stroke();
}

export function drawLabelGridLines(
  context: LabelGridContext,
  rows: number,
  cols: number,
  theme: BoardTheme,
) {
  const firstColumnBoundary = cellSize + gridLineOffset;
  const lastColumnBoundary = (cols + 1) * cellSize + gridLineOffset;
  const firstRowBoundary = cellSize + gridLineOffset;
  const lastRowBoundary = (rows + 1) * cellSize + gridLineOffset;
  const boardWidth = (cols + 2) * cellSize;
  const boardHeight = (rows + 2) * cellSize;

  context.beginPath();
  context.strokeStyle = boardDrawingPalettes[theme].grid;
  context.lineCap = "square";
  context.lineWidth = 1;

  for (const y of [
    gridLineOffset,
    firstRowBoundary,
    lastRowBoundary,
    boardHeight + gridLineOffset,
  ]) {
    context.moveTo(firstColumnBoundary, y);
    context.lineTo(lastColumnBoundary, y);
  }

  for (let column = 0; column <= cols; column += 1) {
    const x = (column + 1) * cellSize + gridLineOffset;

    context.moveTo(x, gridLineOffset);
    context.lineTo(x, firstRowBoundary);
    context.moveTo(x, lastRowBoundary);
    context.lineTo(x, boardHeight + gridLineOffset);
  }

  for (const x of [
    gridLineOffset,
    firstColumnBoundary,
    lastColumnBoundary,
    boardWidth + gridLineOffset,
  ]) {
    context.moveTo(x, firstRowBoundary);
    context.lineTo(x, lastRowBoundary);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = (row + 1) * cellSize + gridLineOffset;

    context.moveTo(gridLineOffset, y);
    context.lineTo(firstColumnBoundary, y);
    context.moveTo(lastColumnBoundary, y);
    context.lineTo(boardWidth + gridLineOffset, y);
  }

  context.stroke();
}

export function drawVisibleBeadCodes({
  beads,
  cols,
  context,
  rows,
  view,
  viewport,
}: {
  beads: readonly (BeadFill | null)[];
  cols: number;
  context: DrawingContext;
  rows: number;
  view: CanvasView;
  viewport: Viewport;
}) {
  const bounds = getVisibleGridBounds({ cols, rows, view, viewport });
  const origin = getGridOrigin();

  context.font = "600 7px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let row = bounds.firstRow; row < bounds.lastRow; row += 1) {
    for (
      let column = bounds.firstColumn;
      column < bounds.lastColumn;
      column += 1
    ) {
      const bead = beads[row * cols + column];

      if (!bead) {
        continue;
      }

      context.fillStyle = getReadableTextColor(bead.hex);
      context.fillText(
        bead.code,
        origin.x + column * cellSize + cellVisualCenterOffset,
        origin.y + row * cellSize + cellVisualCenterOffset,
      );
    }
  }
}

export function getVisibleGridBounds({
  cols,
  rows,
  view,
  viewport,
}: {
  cols: number;
  rows: number;
  view: CanvasView;
  viewport: Viewport;
}) {
  const origin = getGridOrigin();
  const localLeft = -view.x / view.scale - origin.x;
  const localTop = -view.y / view.scale - origin.y;
  const localRight = (viewport.width - view.x) / view.scale - origin.x;
  const localBottom = (viewport.height - view.y) / view.scale - origin.y;

  return {
    firstColumn: clamp(Math.floor(localLeft / cellSize) - 1, 0, cols),
    firstRow: clamp(Math.floor(localTop / cellSize) - 1, 0, rows),
    lastColumn: clamp(Math.ceil(localRight / cellSize) + 1, 0, cols),
    lastRow: clamp(Math.ceil(localBottom / cellSize) + 1, 0, rows),
  };
}

export function createColumnLabelTexture(
  cols: number,
  theme: BoardTheme,
  pixelRatio = 1,
) {
  const canvas = document.createElement("canvas");
  const width = (cols + 2) * cellSize;
  const ratio = Math.max(1, pixelRatio);

  canvas.width = Math.ceil(width * ratio);
  canvas.height = Math.ceil(cellSize * ratio);
  const context = canvas.getContext("2d");

  if (!context) {
    return canvas;
  }

  context.scale(ratio, ratio);
  const palette = boardDrawingPalettes[theme];
  configureLabelContext(context, palette.labelText);

  for (let column = 0; column < cols; column += 1) {
    drawLabelCell(context, (column + 1) * cellSize, 0, column + 1, theme);
  }

  return canvas;
}

export function createRowLabelTexture(
  rows: number,
  theme: BoardTheme,
  pixelRatio = 1,
) {
  const canvas = document.createElement("canvas");
  const height = (rows + 2) * cellSize;
  const ratio = Math.max(1, pixelRatio);

  canvas.width = Math.ceil(cellSize * ratio);
  canvas.height = Math.ceil(height * ratio);
  const context = canvas.getContext("2d");

  if (!context) {
    return canvas;
  }

  context.scale(ratio, ratio);
  const palette = boardDrawingPalettes[theme];
  configureLabelContext(context, palette.labelText);

  for (let row = 0; row < rows; row += 1) {
    drawLabelCell(context, 0, (row + 1) * cellSize, row + 1, theme);
  }

  return canvas;
}

export function getLabelTexturePixelRatio(
  viewScale: number,
  devicePixelRatio: number,
) {
  return Math.min(
    maxLabelTexturePixelRatio,
    Math.max(1, Math.ceil(viewScale * devicePixelRatio)),
  );
}

function drawLabelCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: number,
  theme: BoardTheme,
) {
  const palette = boardDrawingPalettes[theme];

  context.fillStyle = palette.labelBackground;
  context.fillRect(x, y, cellSize, cellSize);
  context.fillStyle = palette.labelText;
  context.fillText(
    String(label),
    x + cellVisualCenterOffset,
    y + cellVisualCenterOffset,
  );
}

function configureLabelContext(
  context: CanvasRenderingContext2D,
  textColor: string,
) {
  context.font = "600 7px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = textColor;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
