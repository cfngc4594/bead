import { expect, test } from "bun:test";
import {
  areBeadCodesVisibleAtFitView,
  minScreenCellSizeForBeadCodes,
  referenceViewportForBeadCodes,
  shouldRenderBeadCodes,
} from "@/features/bead/lib/bead-code-visibility";
import { getInitialScale } from "@/features/bead/lib/canvas-geometry";

test("hides bead codes when zoomed out below readability threshold", () => {
  expect(shouldRenderBeadCodes(true, 0.4)).toBe(false);
  expect(shouldRenderBeadCodes(true, 1)).toBe(false);
});

test("shows bead codes when zoomed in enough", () => {
  const minScale = minScreenCellSizeForBeadCodes / 18;

  expect(shouldRenderBeadCodes(true, minScale)).toBe(true);
  expect(shouldRenderBeadCodes(true, minScale + 0.2)).toBe(true);
});

test("respects user preference to hide bead codes", () => {
  expect(shouldRenderBeadCodes(false, 3)).toBe(false);
});

test("uses canvas dimensions rather than preset size ids", () => {
  const largeFitScale = getInitialScale(87, 87, referenceViewportForBeadCodes);
  const smallFitScale = getInitialScale(16, 16, {
    width: 760,
    height: 640,
  });

  expect(shouldRenderBeadCodes(true, largeFitScale)).toBe(false);
  expect(shouldRenderBeadCodes(true, smallFitScale)).toBe(true);
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
