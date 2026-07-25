import { cellSize, getInitialScale } from "@/features/bead/lib/canvas-geometry";
import type { Viewport } from "@/features/bead/types";

/** Matches `drawBoard` bead code font size in logical pixels. */
export const beadCodeFontSize = 7;

/**
 * Minimum on-screen cell edge length before bead codes are readable.
 * Derived from font size (~7px logical) and typical 2–3 character codes.
 */
export const minScreenCellSizeForBeadCodes = 24;

/** Minimum on-screen font size for legible bead codes. */
export const minScreenFontSizeForBeadCodes = 9;

/**
 * Reference viewport for estimating default fit zoom on phones.
 * Actual editor viewports vary; runtime visibility always uses live scale.
 */
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

export function shouldRenderBeadCodes(
  preference: boolean,
  scale: number,
): boolean {
  if (!preference) {
    return false;
  }

  const screenCellSize = getScreenCellSize(scale);

  return (
    screenCellSize >= minScreenCellSizeForBeadCodes &&
    getScreenBeadCodeFontSize(scale) >= minScreenFontSizeForBeadCodes
  );
}

/** Whether bead codes would appear at the default fit-to-view zoom. */
export function areBeadCodesVisibleAtFitView(
  rows: number,
  cols: number,
  viewport: Viewport = referenceViewportForBeadCodes,
) {
  const fitScale = getInitialScale(rows, cols, viewport);
  return shouldRenderBeadCodes(true, fitScale);
}
