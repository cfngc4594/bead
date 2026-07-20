import type { BoardTheme } from "@/features/bead/lib/board-theme";

type BoardDrawingPalette = {
  cellBackground: string;
  grid: string;
  guide: string;
  labelBackground: string;
  labelText: string;
};

type BoardInteractionPalette = {
  activeSelectionFill: string;
  hoverInnerStroke: string;
  hoverOuterStroke: string;
  invalidSelectionStroke: string;
  selectionFill: string;
  selectionStroke: string;
};

export const boardDrawingPalettes = {
  light: {
    cellBackground: "#ffffff",
    grid: "#d9d9d9",
    guide: "#8f8f8f",
    labelBackground: "#f3f4f6",
    labelText: "#6b7280",
  },
  dark: {
    cellBackground: "#18181b",
    grid: "#3f3f46",
    guide: "#a1a1aa",
    labelBackground: "#27272a",
    labelText: "#d4d4d8",
  },
} satisfies Record<BoardTheme, BoardDrawingPalette>;

export const boardInteractionPalettes = {
  light: {
    activeSelectionFill: "rgba(59, 130, 246, 0.08)",
    hoverInnerStroke: "#111111",
    hoverOuterStroke: "#ffffff",
    invalidSelectionStroke: "#dc2626",
    selectionFill: "rgba(59, 130, 246, 0.12)",
    selectionStroke: "#2563eb",
  },
  dark: {
    activeSelectionFill: "rgba(96, 165, 250, 0.12)",
    hoverInnerStroke: "#111111",
    hoverOuterStroke: "#ffffff",
    invalidSelectionStroke: "#f87171",
    selectionFill: "rgba(96, 165, 250, 0.18)",
    selectionStroke: "#60a5fa",
  },
} satisfies Record<BoardTheme, BoardInteractionPalette>;
