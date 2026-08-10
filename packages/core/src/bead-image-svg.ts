import type { CanvasSnapshot } from "./canvas-snapshot";
import { getMardColor, getMardColorIndex } from "./colors";

export type BeadImageSvg = Readonly<{
  displayOptions: BeadImageDisplayOptions;
  height: number;
  svg: string;
  width: number;
}>;

export type BeadImageDisplayOptions = Readonly<{
  showBeadCodes: boolean;
  showColorLegend: boolean;
  showGuides: boolean;
}>;

export const defaultBeadImageDisplayOptions = {
  showBeadCodes: true,
  showColorLegend: true,
  showGuides: true,
} as const satisfies BeadImageDisplayOptions;

type BeadImageSvgOptions = {
  cols: number;
  displayOptions?: BeadImageDisplayOptions;
  rows: number;
  snapshot: CanvasSnapshot;
};

type BeadImageSvgRendererOptions = Omit<BeadImageSvgOptions, "displayOptions">;

export type BeadImageSvgRenderer = Readonly<{
  render: (displayOptions?: BeadImageDisplayOptions) => BeadImageSvg;
}>;

type BeadStat = {
  code: string;
  count: number;
  hex: string;
};

type GuideInterval = 5 | 10;

type StatsPresentation = {
  height: number;
  layer: string;
};

type StatsLayout = {
  columns: number;
  gap: number;
  height: number;
  itemWidth: number;
  rowHeight: number;
  swatchHeight: number;
  swatchRadius: number;
  fontSize: number;
  textPadding: number;
};

const cellSize = 18;
const boardOrigin = cellSize;
const cellCenterOffset = cellSize / 2 + 0.5;
const exportHorizontalPadding = 10;
const exportTopPadding = 10;
const exportBottomPadding = 5;
const statsBoardGap = 5;
const maxStatsColumns = 8;

const palette = {
  background: "#ffffff",
  cellBackground: "#ffffff",
  grid: "#d9d9d9",
  labelBackground: "#f3f4f6",
  labelText: "#6b7280",
};

export function createBeadImageSvg({
  cols,
  displayOptions = defaultBeadImageDisplayOptions,
  rows,
  snapshot,
}: BeadImageSvgOptions): BeadImageSvg {
  return createBeadImageSvgRenderer({ cols, rows, snapshot }).render(
    displayOptions,
  );
}

export function createBeadImageSvgRenderer({
  cols,
  rows,
  snapshot,
}: BeadImageSvgRendererOptions): BeadImageSvgRenderer {
  assertPositiveInteger(rows, "rows");
  assertPositiveInteger(cols, "cols");

  const cellCount = rows * cols;
  const beads = new Map<number, BeadStat>();
  const statsByCode = new Map<string, BeadStat>();

  for (const [index, code] of snapshot.cells) {
    if (!Number.isInteger(index) || index < 0 || index >= cellCount) {
      throw new Error(`Canvas snapshot index is out of range: ${index}`);
    }
    if (beads.has(index)) {
      throw new Error(`Canvas snapshot index is duplicated: ${index}`);
    }

    const color = getMardColor(code);
    if (!color) {
      throw new Error(`Canvas snapshot contains an unknown color: ${code}`);
    }

    const stat = statsByCode.get(code) ?? {
      code: color.code,
      count: 0,
      hex: color.hex,
    };
    stat.count += 1;
    statsByCode.set(code, stat);
    beads.set(index, stat);
  }

  const stats = Array.from(statsByCode.values()).sort(
    (left, right) =>
      getMardColorIndex(left.code) - getMardColorIndex(right.code),
  );
  const boardWidth = cols * cellSize + boardOrigin * 2;
  const boardHeight = rows * cellSize + boardOrigin * 2;
  const width = boardWidth + exportHorizontalPadding * 2;
  const statsWidth = cols * cellSize;
  const heightWithoutStats =
    boardHeight + exportTopPadding + exportBottomPadding;
  const renderedVariants = new Map<number, BeadImageSvg>();
  let beadCodesLayer: string | undefined;
  let gridLayer: string | undefined;
  let guidesLayer: string | undefined;
  let statsPresentation: StatsPresentation | undefined;

  function getGridLayer() {
    gridLayer ??= createBoardGridLayer({ beads, boardOrigin, cols, rows });
    return gridLayer;
  }

  function getBeadCodesLayer() {
    beadCodesLayer ??= createBeadCodesLayer({ beads, boardOrigin, cols });
    return beadCodesLayer;
  }

  function getGuidesLayer() {
    guidesLayer ??= createGuideElements(rows, cols, boardOrigin).join("");
    return guidesLayer;
  }

  function getStatsPresentation() {
    if (statsPresentation) {
      return statsPresentation;
    }

    const layout = getStatsLayout({
      boardHeight,
      statsCount: stats.length,
      statsWidth,
      totalWidth: width,
    });
    const y = boardHeight + statsBoardGap;
    statsPresentation = {
      height: y + layout.height + exportTopPadding + exportBottomPadding,
      layer: createStatsElements(stats, boardOrigin, y, layout).join(""),
    };
    return statsPresentation;
  }

  return {
    render(displayOptions = defaultBeadImageDisplayOptions) {
      const cacheKey = getDisplayOptionsCacheKey(displayOptions);
      const cached = renderedVariants.get(cacheKey);

      if (cached) {
        return cached;
      }

      const visibleStats = displayOptions.showColorLegend
        ? getStatsPresentation()
        : null;
      const height = visibleStats?.height ?? heightWithoutStats;
      const image = {
        displayOptions: {
          showBeadCodes: displayOptions.showBeadCodes,
          showColorLegend: displayOptions.showColorLegend,
          showGuides: displayOptions.showGuides,
        },
        height,
        svg: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
          `<rect width="${width}" height="${height}" fill="${palette.background}"/>`,
          `<g transform="translate(${exportHorizontalPadding} ${exportTopPadding})">`,
          getGridLayer(),
          displayOptions.showGuides ? getGuidesLayer() : "",
          displayOptions.showBeadCodes ? getBeadCodesLayer() : "",
          visibleStats?.layer ?? "",
          "</g>",
          "</svg>",
        ].join(""),
        width,
      };

      renderedVariants.set(cacheKey, image);
      return image;
    },
  };
}

function createBoardGridLayer({
  beads,
  boardOrigin,
  cols,
  rows,
}: {
  beads: ReadonlyMap<number, BeadStat>;
  boardOrigin: number;
  cols: number;
  rows: number;
}) {
  const gridElements: string[] = [
    '<g shape-rendering="crispEdges">',
    ...createLabelElements(rows, cols, boardOrigin),
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const x = boardOrigin + col * cellSize;
      const y = boardOrigin + row * cellSize;
      const bead = beads.get(index);

      gridElements.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize}" height="${cellSize}" fill="${palette.cellBackground}" stroke="${palette.grid}"/>`,
      );

      if (bead) {
        gridElements.push(
          `<rect x="${x + 1}" y="${y + 1}" width="${cellSize - 1}" height="${cellSize - 1}" fill="${bead.hex}"/>`,
        );
      }
    }
  }
  gridElements.push("</g>");

  return gridElements.join("");
}

function createBeadCodesLayer({
  beads,
  boardOrigin,
  cols,
}: {
  beads: ReadonlyMap<number, BeadStat>;
  boardOrigin: number;
  cols: number;
}) {
  return Array.from(beads.entries())
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([index, bead]) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = boardOrigin + col * cellSize + cellCenterOffset;
      const y = boardOrigin + row * cellSize + cellCenterOffset;

      return createCenteredText(
        bead.code,
        x,
        y,
        getReadableTextColor(bead.hex),
      );
    })
    .join("");
}

function createGuideElements(rows: number, cols: number, boardOrigin: number) {
  const fiveCellGuides: string[] = [];
  const tenCellGuides: string[] = [];
  const boardRight = boardOrigin + cols * cellSize + 0.5;
  const boardBottom = boardOrigin + rows * cellSize + 0.5;
  const boardStart = boardOrigin + 0.5;

  for (let col = 5; col < cols; col += 5) {
    const x = boardOrigin + col * cellSize + 0.5;
    const interval: GuideInterval = col % 10 === 0 ? 10 : 5;
    const target = interval === 10 ? tenCellGuides : fiveCellGuides;
    target.push(createGuideLine(x, boardStart, x, boardBottom, interval));
  }

  for (let row = 5; row < rows; row += 5) {
    const y = boardOrigin + row * cellSize + 0.5;
    const interval: GuideInterval = row % 10 === 0 ? 10 : 5;
    const target = interval === 10 ? tenCellGuides : fiveCellGuides;
    target.push(createGuideLine(boardStart, y, boardRight, y, interval));
  }

  return [
    '<g data-guide-interval="5">',
    ...fiveCellGuides,
    "</g>",
    '<g data-guide-interval="10">',
    ...tenCellGuides,
    "</g>",
  ];
}

function createGuideLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  interval: GuideInterval,
) {
  const coordinates = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;

  if (interval === 10) {
    return [
      `<line ${coordinates} stroke="#ffffff" stroke-width="2.5"/>`,
      `<line ${coordinates} stroke="#334155" stroke-width="1.5"/>`,
    ].join("");
  }

  return [
    `<line ${coordinates} stroke="#ffffff" stroke-width="1.75" stroke-dasharray="4 3"/>`,
    `<line ${coordinates} stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>`,
  ].join("");
}

function createLabelElements(rows: number, cols: number, boardOrigin: number) {
  const elements: string[] = [];
  const bottomY = (rows + 1) * cellSize;
  const rightX = (cols + 1) * cellSize;

  for (let col = 0; col < cols; col += 1) {
    const label = String(col + 1);
    const x = boardOrigin + col * cellSize;
    elements.push(createLabelCell(label, x, 0));
    elements.push(createLabelCell(label, x, bottomY));
  }

  for (let row = 0; row < rows; row += 1) {
    const label = String(row + 1);
    const y = boardOrigin + row * cellSize;
    elements.push(createLabelCell(label, 0, y));
    elements.push(createLabelCell(label, rightX, y));
  }

  return elements;
}

function createLabelCell(label: string, x: number, y: number) {
  return [
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize}" height="${cellSize}" fill="${palette.labelBackground}" stroke="${palette.grid}"/>`,
    createCenteredText(
      label,
      x + cellCenterOffset,
      y + cellCenterOffset,
      palette.labelText,
    ),
  ].join("");
}

function createCenteredText(text: string, x: number, y: number, fill: string) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="7" font-weight="600" text-anchor="middle" dominant-baseline="central">${escapeXml(text)}</text>`;
}

function createStatsElements(
  stats: readonly BeadStat[],
  x: number,
  y: number,
  layout: StatsLayout,
) {
  if (stats.length === 0) {
    return [];
  }

  const elements = [
    `<rect x="${x}" y="${y}" width="${layout.itemWidth * layout.columns + layout.gap * Math.max(0, layout.columns - 1)}" height="${layout.height}" fill="#ffffff"/>`,
  ];

  stats.forEach((stat, index) => {
    const row = Math.floor(index / layout.columns);
    const column = index % layout.columns;
    const itemX = x + column * (layout.itemWidth + layout.gap);
    const itemY = y + row * (layout.rowHeight + layout.gap);
    const swatchY = itemY + (layout.rowHeight - layout.swatchHeight) / 2;

    elements.push(
      `<rect x="${itemX}" y="${swatchY}" width="${layout.itemWidth}" height="${layout.swatchHeight}" rx="${layout.swatchRadius}" fill="${stat.hex}"/>`,
      `<text x="${itemX + layout.textPadding}" y="${swatchY + layout.swatchHeight / 2}" fill="${getReadableTextColor(stat.hex)}" font-family="Arial, sans-serif" font-size="${layout.fontSize}" font-weight="600" text-anchor="start" dominant-baseline="central">${escapeXml(`${stat.code} (${stat.count})`)}</text>`,
    );
  });

  return elements;
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
}) {
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
  const gap = clamp(Math.round(shortSide * 0.004), 2, 7);
  const fontSize = clamp(Math.round(shortSide * 0.009), 7, 14);
  const textPadding = clamp(Math.round(shortSide * 0.006), 4, 10);
  const swatchHeight = clamp(Math.round(totalHeight * 0.013), 10, 24);
  const rowHeight = Math.max(swatchHeight + 4, fontSize + 6);
  const swatchRadius = clamp(Math.round(shortSide * 0.0035), 2, 6);
  const minimumItemWidth = clamp(Math.round(totalWidth * 0.065), 48, 96);
  const columns =
    statsCount === 0
      ? 1
      : Math.min(
          maxStatsColumns,
          Math.max(1, Math.floor((width + gap) / (minimumItemWidth + gap))),
        );
  const rows = statsCount === 0 ? 0 : Math.ceil(statsCount / columns);
  const itemWidth =
    columns > 0 ? (width - Math.max(0, columns - 1) * gap) / columns : width;
  const height =
    rows === 0 ? 0 : rows * rowHeight + Math.max(0, rows - 1) * gap;

  return {
    columns,
    gap,
    height,
    itemWidth,
    rowHeight,
    swatchHeight,
    swatchRadius,
    fontSize,
    textPadding,
  };
}

function getReadableTextColor(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 150 ? "#111111" : "#ffffff";
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

function assertPositiveInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function getDisplayOptionsCacheKey({
  showBeadCodes,
  showColorLegend,
  showGuides,
}: BeadImageDisplayOptions) {
  return (
    Number(showBeadCodes) |
    (Number(showColorLegend) << 1) |
    (Number(showGuides) << 2)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
