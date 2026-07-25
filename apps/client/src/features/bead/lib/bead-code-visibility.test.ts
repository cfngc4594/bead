import { expect, test } from "bun:test";
import {
  areBeadCodesVisibleAtFitView,
  canShowBeadCodesAtScale,
  hideScreenCellSizeForBeadCodes,
  minScreenCellSizeForBeadCodes,
  referenceViewportForBeadCodes,
  resolveBeadCodeRendering,
} from "@/features/bead/lib/bead-code-visibility";
import { getInitialScale } from "@/features/bead/lib/canvas-geometry";

test("hides bead codes when zoomed out below readability threshold", () => {
  expect(canShowBeadCodesAtScale(0.4)).toBe(false);
  expect(canShowBeadCodesAtScale(1)).toBe(false);
});

test("shows bead codes when zoomed in enough", () => {
  const minScale = minScreenCellSizeForBeadCodes / 18;

  expect(canShowBeadCodesAtScale(minScale)).toBe(true);
  expect(canShowBeadCodesAtScale(minScale + 0.2)).toBe(true);
});

test("uses canvas dimensions rather than preset size ids", () => {
  const largeFitScale = getInitialScale(87, 87, referenceViewportForBeadCodes);
  const smallFitScale = getInitialScale(16, 16, {
    width: 760,
    height: 640,
  });

  expect(canShowBeadCodesAtScale(largeFitScale)).toBe(false);
  expect(canShowBeadCodesAtScale(smallFitScale)).toBe(true);
  expect(areBeadCodesVisibleAtFitView(87, 87)).toBe(false);
  expect(
    areBeadCodesVisibleAtFitView(16, 16, { width: 760, height: 640 }),
  ).toBe(true);
});

test("supports non-square custom canvases via max dimension", () => {
  expect(areBeadCodesVisibleAtFitView(30, 120)).toBe(false);
  expect(
    areBeadCodesVisibleAtFitView(12, 20, { width: 760, height: 640 }),
  ).toBe(true);
});

test("hysteresis keeps bead codes visible between hide and show thresholds", () => {
  const midScale = 22 / 18;

  expect(resolveBeadCodeRendering(midScale, false)).toBe(false);
  expect(resolveBeadCodeRendering(midScale, true)).toBe(true);
});

test("hysteresis hides bead codes once below hide threshold", () => {
  const hideScale = hideScreenCellSizeForBeadCodes / 18;

  expect(resolveBeadCodeRendering(hideScale, true)).toBe(false);
});
