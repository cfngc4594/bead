import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import {
  boardOrigin,
  cellSize,
  getBoardSize,
} from "@/features/bead/lib/canvas-geometry";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";
import { downloadImageBlob } from "@/features/bead/lib/download-file";
import type { BeadStat } from "@/features/bead/lib/stats";
import { getBeadStats } from "@/features/bead/lib/stats";
import type { BeadFill } from "@/features/bead/types";

type ExportBeadImageOptions = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
  showBeadCodes: boolean;
  showGuideLines: boolean;
};

type DownloadBeadImageOptions = ExportBeadImageOptions & {
  filename: string;
};

const exportScale = 4;
const exportHorizontalPadding = 10;
const exportTopPadding = 10;
const exportBottomPadding = 5;
const statsBoardGap = 5;
const statsHorizontalPadding = 0;
const statsVerticalPadding = 0;
const statsGap = 1;
const statsSwatchSize = cellSize * 1.5;
const statsItemWidth = statsSwatchSize + 3;
const statsSwatchRadius = 5;
const statsCountHeight = 12;
const statsTopGap = 0;

export function createBeadImageBlob({
  rows,
  cols,
  beads,
  showBeadCodes,
  showGuideLines,
}: ExportBeadImageOptions) {
  const boardSize = getBoardSize(rows, cols);
  const stats = getBeadStats(beads);
  const statsWidth = cols * cellSize;
  const statsHeight = getStatsHeight(statsWidth, stats.length);
  const statsY = boardSize.height + statsBoardGap;
  const imageHeight = boardSize.height + statsBoardGap + statsHeight;
  const canvas = document.createElement("canvas");
  canvas.width = (boardSize.width + exportHorizontalPadding * 2) * exportScale;
  canvas.height =
    (imageHeight + exportTopPadding + exportBottomPadding) * exportScale;

  const context = canvas.getContext("2d");

  if (!context) {
    return Promise.reject(new Error("Unable to create export image."));
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(exportScale, exportScale);
  context.translate(exportHorizontalPadding, exportTopPadding);
  drawBoard(context, rows, cols, beads, { showBeadCodes, showGuideLines });
  drawBeadStats(context, {
    stats,
    x: boardOrigin,
    y: statsY,
    width: statsWidth,
    height: statsHeight,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to create export image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export async function exportBeadImage({
  filename,
  ...options
}: DownloadBeadImageOptions) {
  const blob = await createBeadImageBlob(options);
  await downloadImageBlob(blob, filename);
}

function getStatsHeight(width: number, statsCount: number) {
  if (statsCount === 0) {
    return 0;
  }

  const columns = getStatsColumns(width);
  const rows = Math.ceil(statsCount / columns);
  const itemHeight = statsSwatchSize + statsCountHeight;

  return (
    statsTopGap +
    statsVerticalPadding +
    rows * itemHeight +
    Math.max(0, rows - 1) * statsGap +
    statsVerticalPadding
  );
}

function getStatsColumns(width: number) {
  const availableWidth = Math.max(0, width - statsHorizontalPadding * 2);

  return Math.max(
    1,
    Math.floor((availableWidth + statsGap) / (statsItemWidth + statsGap)),
  );
}

function drawBeadStats(
  context: CanvasRenderingContext2D,
  {
    stats,
    x,
    y,
    width,
    height,
  }: {
    stats: readonly BeadStat[];
    x: number;
    y: number;
    width: number;
    height: number;
  },
) {
  if (stats.length === 0) {
    return;
  }

  const columns = getStatsColumns(width);
  const startX = x + statsHorizontalPadding;
  const startY = y + statsTopGap + statsVerticalPadding;

  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, height);

  stats.forEach((stat, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const itemX = startX + column * (statsItemWidth + statsGap);
    const itemY =
      startY + row * (statsSwatchSize + statsCountHeight + statsGap);

    drawStatItem(context, stat, itemX, itemY);
  });

  context.restore();
}

function drawStatItem(
  context: CanvasRenderingContext2D,
  stat: BeadStat,
  x: number,
  y: number,
) {
  roundedRectPath(context, x, y, statsSwatchSize, statsSwatchSize);
  context.fillStyle = stat.hex;
  context.fill();

  context.fillStyle = getReadableTextColor(stat.hex);
  context.font = "600 9px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(stat.code, x + statsSwatchSize / 2, y + statsSwatchSize / 2);

  context.fillStyle = "#111827";
  context.font = "600 8px sans-serif";
  context.fillText(
    `(${stat.count})`,
    x + statsSwatchSize / 2,
    y + statsSwatchSize + statsCountHeight / 2 + 1,
  );
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radius = Math.min(statsSwatchRadius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
