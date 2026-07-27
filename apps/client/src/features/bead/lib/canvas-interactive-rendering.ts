import type { Context } from "konva/lib/Context";
import type { BoardTheme } from "@/features/bead/lib/board-theme";
import { boardDrawingPalettes } from "@/features/bead/lib/board-theme-colors";
import { cellSize, getGridOrigin } from "@/features/bead/lib/canvas-geometry";
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
    const x = origin.x + column * cellSize + 0.5;
    context.moveTo(x, origin.y + 0.5);
    context.lineTo(x, origin.y + height + 0.5);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = origin.y + row * cellSize + 0.5;
    context.moveTo(origin.x + 0.5, y);
    context.lineTo(origin.x + width + 0.5, y);
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
        origin.x + column * cellSize + cellSize / 2,
        origin.y + row * cellSize + cellSize / 2,
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
  context.strokeStyle = palette.grid;
  context.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
  context.fillStyle = palette.labelText;
  context.fillText(String(label), x + cellSize / 2, y + cellSize / 2);
}

function configureLabelContext(
  context: CanvasRenderingContext2D,
  textColor: string,
) {
  context.font = "600 7px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 1;
  context.fillStyle = textColor;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
