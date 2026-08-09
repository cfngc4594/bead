import { expect, test } from "bun:test";
import { shouldShowTransientCanvasToolHint } from "@/features/bead/lib/canvas-tool-hint";

test("shows transient tool hints for touch input in desktop layouts", () => {
  expect(
    shouldShowTransientCanvasToolHint({
      layout: "desktop",
      pointerType: "touch",
    }),
  ).toBe(true);
});

test("shows transient tool hints for pen input in desktop layouts", () => {
  expect(
    shouldShowTransientCanvasToolHint({
      layout: "desktop",
      pointerType: "pen",
    }),
  ).toBe(true);
});

test("keeps hover tooltips for mouse input in desktop layouts", () => {
  expect(
    shouldShowTransientCanvasToolHint({
      layout: "desktop",
      pointerType: "mouse",
    }),
  ).toBe(false);
});

test("always shows transient tool hints in mobile layouts", () => {
  expect(
    shouldShowTransientCanvasToolHint({
      layout: "mobile",
      pointerType: null,
    }),
  ).toBe(true);
});
