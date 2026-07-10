import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import {
  boardOrigin,
  cellSize,
  getBoardSize,
} from "@/features/bead/lib/canvas-geometry";
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
const maxStatsColumns = 8;

type StatsLayout = {
  columns: number;
  height: number;
  itemWidth: number;
  rowHeight: number;
  horizontalPadding: number;
  verticalPadding: number;
  gap: number;
  innerGap: number;
  topGap: number;
  swatchHeight: number;
  swatchRadius: number;
  labelWidth: number;
  codeFontSize: number;
  countFontSize: number;
};

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
  const imageWidth = boardSize.width + exportHorizontalPadding * 2;
  const statsLayout = getStatsLayout({
    boardHeight: boardSize.height,
    statsCount: stats.length,
    statsWidth,
    totalWidth: imageWidth,
  });
  const statsY = boardSize.height + statsBoardGap;
  const imageHeight = boardSize.height + statsBoardGap + statsLayout.height;
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth * exportScale;
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
    layout: statsLayout,
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

function getStatsLayout({
  boardHeight,
  statsCount,
  statsWidth,
  totalWidth,
}: {
  boardHeight: number;
  statsCount: number;
  statsWidth: number;
  totalWidth: number;
}): StatsLayout {
  let totalHeight =
    boardHeight + statsBoardGap + exportTopPadding + exportBottomPadding;
  let layout = createStatsLayout(
    statsWidth,
    statsCount,
    totalWidth,
    totalHeight,
  );

  for (let index = 0; index < 3; index += 1) {
    totalHeight =
      boardHeight +
      statsBoardGap +
      layout.height +
      exportTopPadding +
      exportBottomPadding;
    layout = createStatsLayout(statsWidth, statsCount, totalWidth, totalHeight);
  }

  return layout;
}

function createStatsLayout(
  width: number,
  statsCount: number,
  totalWidth: number,
  totalHeight: number,
): StatsLayout {
  const shortSide = Math.min(totalWidth, totalHeight);
  const horizontalPadding = 0;
  const verticalPadding = 0;
  const topGap = 0;
  const gap = clamp(Math.round(shortSide * 0.004), 2, 7);
  const innerGap = gap;
  const codeFontSize = clamp(Math.round(shortSide * 0.009), 7, 14);
  const countFontSize = clamp(Math.round(codeFontSize * 0.85), 6, 12);
  const swatchHeight = clamp(Math.round(totalHeight * 0.013), 10, 24);
  const rowHeight = Math.max(
    swatchHeight + 4,
    codeFontSize + countFontSize + 5,
  );
  const labelWidth = clamp(Math.round(totalWidth * 0.032), 22, 42);
  const swatchRadius = clamp(Math.round(shortSide * 0.0035), 2, 6);
  const minimumItemWidth = clamp(Math.round(totalWidth * 0.065), 48, 96);
  const availableWidth = Math.max(0, width - horizontalPadding * 2);
  const columns =
    statsCount === 0
      ? 1
      : Math.min(
          maxStatsColumns,
          Math.max(
            1,
            Math.floor((availableWidth + gap) / (minimumItemWidth + gap)),
          ),
        );
  const rows = statsCount === 0 ? 0 : Math.ceil(statsCount / columns);
  const itemWidth =
    columns > 0
      ? (availableWidth - Math.max(0, columns - 1) * gap) / columns
      : availableWidth;
  const height =
    rows === 0
      ? 0
      : topGap +
        verticalPadding +
        rows * rowHeight +
        Math.max(0, rows - 1) * gap +
        verticalPadding;

  return {
    columns,
    height,
    itemWidth,
    rowHeight,
    horizontalPadding,
    verticalPadding,
    gap,
    innerGap,
    topGap,
    swatchHeight,
    swatchRadius,
    labelWidth,
    codeFontSize,
    countFontSize,
  };
}

function drawBeadStats(
  context: CanvasRenderingContext2D,
  {
    stats,
    x,
    y,
    width,
    layout,
  }: {
    stats: readonly BeadStat[];
    x: number;
    y: number;
    width: number;
    layout: StatsLayout;
  },
) {
  if (stats.length === 0) {
    return;
  }

  const startX = x + layout.horizontalPadding;
  const startY = y + layout.topGap + layout.verticalPadding;

  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, layout.height);

  stats.forEach((stat, index) => {
    const row = Math.floor(index / layout.columns);
    const column = index % layout.columns;
    const itemX = startX + column * (layout.itemWidth + layout.gap);
    const itemY = startY + row * (layout.rowHeight + layout.gap);

    drawStatItem(context, stat, itemX, itemY, layout);
  });

  context.restore();
}

function drawStatItem(
  context: CanvasRenderingContext2D,
  stat: BeadStat,
  x: number,
  y: number,
  layout: StatsLayout,
) {
  const labelWidth = Math.min(layout.labelWidth, layout.itemWidth * 0.45);
  const swatchX = x + labelWidth + layout.innerGap;
  const swatchY = y + (layout.rowHeight - layout.swatchHeight) / 2;
  const swatchWidth = Math.max(
    1,
    layout.itemWidth - labelWidth - layout.innerGap,
  );

  roundedRectPath(
    context,
    swatchX,
    swatchY,
    swatchWidth,
    layout.swatchHeight,
    layout.swatchRadius,
  );
  context.fillStyle = stat.hex;
  context.fill();

  context.fillStyle = "#111827";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 ${layout.codeFontSize}px sans-serif`;
  context.fillText(
    stat.code,
    x + labelWidth / 2,
    y + layout.rowHeight / 2 - layout.countFontSize * 0.45,
    labelWidth,
  );

  context.font = `600 ${layout.countFontSize}px sans-serif`;
  context.fillText(
    String(stat.count),
    x + labelWidth / 2,
    y + layout.rowHeight / 2 + layout.codeFontSize * 0.55,
    labelWidth,
  );
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rectRadius: number,
) {
  const radius = Math.min(rectRadius, width / 2, height / 2);

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
