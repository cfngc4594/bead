import { mardColors } from "@/data/colors";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import {
  boardOrigin,
  cellSize,
  getBoardSize,
} from "@/features/bead/lib/canvas-geometry";
import { getReadableTextColor } from "@/features/bead/lib/color-utils";
import type { BeadFill } from "@/features/bead/types";

type ExportBeadImageOptions = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
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

type BeadStat = BeadFill & {
  count: number;
};

export function exportBeadImage({
  rows,
  cols,
  beads,
  filename,
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
    return;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(exportScale, exportScale);
  context.translate(exportHorizontalPadding, exportTopPadding);
  drawBoard(context, rows, cols, beads);
  drawBeadStats(context, {
    stats,
    x: boardOrigin,
    y: statsY,
    width: statsWidth,
    height: statsHeight,
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    downloadBlob(blob, filename);
  }, "image/png");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getBeadStats(beads: readonly (BeadFill | null)[]) {
  const statsByCode = new Map<string, BeadStat>();

  for (const bead of beads) {
    if (!bead) {
      continue;
    }

    const stat = statsByCode.get(bead.code);

    if (stat) {
      stat.count += 1;
      continue;
    }

    statsByCode.set(bead.code, {
      code: bead.code,
      hex: bead.hex,
      count: 1,
    });
  }

  return Array.from(statsByCode.values()).sort(compareBeadStats);
}

function compareBeadStats(a: BeadStat, b: BeadStat) {
  return getColorSortIndex(a.code) - getColorSortIndex(b.code);
}

function getColorSortIndex(code: string) {
  const index = mardColors.findIndex((color) => color.code === code);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
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
