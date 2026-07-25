import { useEffect, useState } from "react";
import { cellSize, getInitialScale } from "@/features/bead/lib/canvas-geometry";
import type { Viewport } from "@/features/bead/types";

/** Matches `drawBoard` bead code font size in logical pixels. */
export const beadCodeFontSize = 7;

/** Show bead codes once cells reach this on-screen size. */
export const minScreenCellSizeForBeadCodes = 24;

/** Hide bead codes once cells shrink below this on-screen size. */
export const hideScreenCellSizeForBeadCodes = 20;

/** Minimum on-screen font size for legible bead codes. */
export const minScreenFontSizeForBeadCodes = 9;

export const referenceViewportForBeadCodes: Viewport = {
  width: 390,
  height: 700,
};

export function getScreenCellSize(scale: number) {
  return cellSize * scale;
}

export function getScreenBeadCodeFontSize(scale: number) {
  return beadCodeFontSize * scale;
}

export function canShowBeadCodesAtScale(scale: number) {
  const screenCellSize = getScreenCellSize(scale);

  return (
    screenCellSize >= minScreenCellSizeForBeadCodes &&
    getScreenBeadCodeFontSize(scale) >= minScreenFontSizeForBeadCodes
  );
}

export function shouldHideBeadCodesAtScale(scale: number) {
  return getScreenCellSize(scale) <= hideScreenCellSizeForBeadCodes;
}

export function resolveBeadCodeRendering(scale: number, wasRendering: boolean) {
  if (canShowBeadCodesAtScale(scale)) {
    return true;
  }

  if (shouldHideBeadCodesAtScale(scale)) {
    return false;
  }

  return wasRendering;
}

export function useBeadCodeRendering(scale: number) {
  const [rendering, setRendering] = useState(() =>
    resolveBeadCodeRendering(scale, false),
  );

  useEffect(() => {
    setRendering((wasRendering) =>
      resolveBeadCodeRendering(scale, wasRendering),
    );
  }, [scale]);

  return rendering;
}

export function areBeadCodesVisibleAtFitView(
  rows: number,
  cols: number,
  viewport: Viewport = referenceViewportForBeadCodes,
) {
  const fitScale = getInitialScale(rows, cols, viewport);
  return canShowBeadCodesAtScale(fitScale);
}
