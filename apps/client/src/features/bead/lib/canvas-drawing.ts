import type { BoardTheme } from "@/features/bead/lib/board-theme";
import { boardDrawingPalettes } from "@/features/bead/lib/board-theme-colors";
import { cellSize, getGridOrigin } from "@/features/bead/lib/canvas-geometry";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";
import type { BeadFill } from "@/features/bead/types";

export type BoardDrawingContext = Pick<
  CanvasRenderingContext2D,
  | "fillRect"
  | "fillStyle"
  | "fillText"
  | "font"
  | "beginPath"
  | "lineTo"
  | "lineWidth"
  | "moveTo"
  | "restore"
  | "save"
  | "stroke"
  | "strokeRect"
  | "strokeStyle"
  | "textAlign"
  | "textBaseline"
>;

export function drawBoard(
  context: BoardDrawingContext,
  rows: number,
  cols: number,
  beads: readonly (BeadFill | null)[],
  options: {
    showBeadCodes?: boolean;
    showGuideLines?: boolean;
    showGrid?: boolean;
    showLabels?: boolean;
    theme?: BoardTheme;
  } = {},
) {
  const {
    showBeadCodes = true,
    showGuideLines = false,
    showGrid = true,
    showLabels = true,
    theme = "light",
  } = options;
  const palette = boardDrawingPalettes[theme];

  context.save();
  if (showLabels) {
    drawLabels(context, rows, cols, palette);
  }

  const origin = showLabels ? getGridOrigin() : { x: 0, y: 0 };
  const beadInset = showGrid ? 1 : 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = origin.x + col * cellSize;
      const y = origin.y + row * cellSize;
      const color = beads[row * cols + col];

      context.fillStyle = palette.cellBackground;
      context.fillRect(x, y, cellSize, cellSize);

      if (showGrid) {
        context.strokeStyle = palette.grid;
        context.lineWidth = 1;
        context.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
      }

      if (color) {
        context.fillStyle = color.hex;
        context.fillRect(
          x + beadInset,
          y + beadInset,
          cellSize - beadInset,
          cellSize - beadInset,
        );

        if (showBeadCodes) {
          context.fillStyle = getReadableTextColor(color.hex);
          context.font = "600 7px sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(color.code, x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }

  if (showGuideLines) {
    drawGuideLines(context, rows, cols, origin, palette.guide);
  }

  context.restore();
}

function drawGuideLines(
  context: BoardDrawingContext,
  rows: number,
  cols: number,
  origin: { x: number; y: number },
  guideColor: string,
) {
  const width = cols * cellSize;
  const height = rows * cellSize;

  context.strokeStyle = guideColor;
  context.lineWidth = 2;

  for (let col = 5; col < cols; col += 5) {
    const x = origin.x + col * cellSize + 0.5;

    context.beginPath();
    context.moveTo(x, origin.y);
    context.lineTo(x, origin.y + height);
    context.stroke();
  }

  for (let row = 5; row < rows; row += 5) {
    const y = origin.y + row * cellSize + 0.5;

    context.beginPath();
    context.moveTo(origin.x, y);
    context.lineTo(origin.x + width, y);
    context.stroke();
  }
}

function drawLabels(
  context: BoardDrawingContext,
  rows: number,
  cols: number,
  palette: (typeof boardDrawingPalettes)[BoardTheme],
) {
  const boardHeight = (rows + 2) * cellSize;

  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  context.font = "600 7px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = palette.labelText;

  for (let col = 0; col < cols; col += 1) {
    const label = String(col + 1);
    const x = cellSize + col * cellSize;

    drawLabelCell(context, x, 0, label, palette);
    drawLabelCell(context, x, boardHeight - cellSize, label, palette);
  }

  for (let row = 0; row < rows; row += 1) {
    const label = String(row + 1);
    const y = cellSize + row * cellSize;
    const rightLabelX = (cols + 1) * cellSize;

    drawLabelCell(context, 0, y, label, palette);
    drawLabelCell(context, rightLabelX, y, label, palette);
  }
}

function drawLabelCell(
  context: BoardDrawingContext,
  x: number,
  y: number,
  label: string,
  palette: (typeof boardDrawingPalettes)[BoardTheme],
) {
  context.fillStyle = palette.labelBackground;
  context.fillRect(x, y, cellSize, cellSize);
  context.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
  context.fillStyle = palette.labelText;
  context.fillText(label, x + cellSize / 2, y + cellSize / 2);
}
