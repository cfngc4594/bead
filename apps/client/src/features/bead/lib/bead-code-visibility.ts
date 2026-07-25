import { useEffect, useState } from "react";
import {
  cellSize,
  getInitialScale,
} from "@/features/bead/lib/canvas-geometry";
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

export type BeadCodeRenderState = {
  preference: boolean;
  rendering: boolean;
  zoomLimited: boolean;
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

export function resolveBeadCodeRendering(
  preference: boolean,
  scale: number,
  wasRendering: boolean,
) {
  if (!preference) {
    return false;
  }

  if (canShowBeadCodesAtScale(scale)) {
    return true;
  }

  if (shouldHideBeadCodesAtScale(scale)) {
    return false;
  }

  return wasRendering;
}

export function useBeadCodeRendering(preference: boolean, scale: number) {
  const [rendering, setRendering] = useState(() =>
    resolveBeadCodeRendering(preference, scale, false),
  );

  useEffect(() => {
    setRendering((wasRendering) =>
      resolveBeadCodeRendering(preference, scale, wasRendering),
    );
  }, [preference, scale]);

  return {
    preference,
    rendering,
    zoomLimited: preference && !rendering,
  } satisfies BeadCodeRenderState;
}

export function getBeadCodeToggleUi({
  preference,
  zoomLimited,
}: {
  preference: boolean;
  zoomLimited: boolean;
}) {
  if (!preference) {
    return {
      label: "显示豆色序号",
      tooltip: "显示豆色序号",
      muted: false,
      preferenceOffActive: true,
    } as const;
  }

  if (zoomLimited) {
    return {
      label: "豆色序号",
      tooltip: "放大以显示序号",
      muted: true,
      preferenceOffActive: false,
    } as const;
  }

  return {
    label: "隐藏豆色序号",
    tooltip: "隐藏豆色序号",
    muted: false,
    preferenceOffActive: false,
  } as const;
}

export function areBeadCodesVisibleAtFitView(
  rows: number,
  cols: number,
  viewport: Viewport = referenceViewportForBeadCodes,
) {
  const fitScale = getInitialScale(rows, cols, viewport);
  return canShowBeadCodesAtScale(fitScale);
}
