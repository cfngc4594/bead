import { expect, test } from "bun:test";
import {
  drawGridLines,
  drawVisibleBeadCodes,
  getLabelTexturePixelRatio,
  getVisibleGridBounds,
  syncBeadTexture,
} from "@/features/bead/lib/canvas-interactive-rendering";

test("returns the whole grid when it fits in the viewport", () => {
  expect(
    getVisibleGridBounds({
      cols: 16,
      rows: 16,
      view: { x: 24, y: 24, scale: 1 },
      viewport: { width: 760, height: 640 },
    }),
  ).toEqual({
    firstColumn: 0,
    firstRow: 0,
    lastColumn: 16,
    lastRow: 16,
  });
});

test("culls bead codes outside a zoomed viewport", () => {
  const bounds = getVisibleGridBounds({
    cols: 87,
    rows: 87,
    view: { x: -360, y: -180, scale: 2 },
    viewport: { width: 360, height: 360 },
  });

  expect(bounds.firstColumn).toBeGreaterThan(0);
  expect(bounds.firstRow).toBeGreaterThan(0);
  expect(bounds.lastColumn).toBeLessThan(87);
  expect(bounds.lastRow).toBeLessThan(87);
});

test("draws the maximum grid as one batched path", () => {
  let moveCount = 0;
  let lineCount = 0;
  let strokeCount = 0;
  const context = {
    beginPath() {},
    drawImage() {},
    fillStyle: "",
    fillText() {},
    font: "",
    imageSmoothingEnabled: true,
    lineTo() {
      lineCount += 1;
    },
    lineWidth: 1,
    moveTo() {
      moveCount += 1;
    },
    restore() {},
    save() {},
    stroke() {
      strokeCount += 1;
    },
    strokeStyle: "",
    textAlign: "start" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
  };

  drawGridLines(context, 87, 87, "light");

  expect(moveCount).toBe(176);
  expect(lineCount).toBe(176);
  expect(strokeCount).toBe(1);
});

test("updates only changed bead texture pixels after initialization", () => {
  const painted: [number, number][] = [];
  const cleared: [number, number][] = [];
  const context = {
    clearRect(column: number, row: number) {
      cleared.push([column, row]);
    },
    fillRect(column: number, row: number) {
      painted.push([column, row]);
    },
    fillStyle: "",
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;
  const initial = [null, { code: "A1", hex: "#fff8cc" }];

  syncBeadTexture({
    beads: initial,
    canvas,
    cols: 2,
    previousBeads: null,
    rows: 1,
  });
  painted.length = 0;
  cleared.length = 0;

  const changed = syncBeadTexture({
    beads: [null, { code: "B1", hex: "#ffd500" }],
    canvas,
    cols: 2,
    previousBeads: initial,
    rows: 1,
  });

  expect(changed).toBe(1);
  expect(painted).toEqual([[1, 0]]);
  expect(cleared).toEqual([]);
});

test("scales label textures for the current zoom and device density", () => {
  expect(getLabelTexturePixelRatio(0.25, 2)).toBe(1);
  expect(getLabelTexturePixelRatio(1.4, 2)).toBe(3);
  expect(getLabelTexturePixelRatio(3, 2)).toBe(6);
  expect(getLabelTexturePixelRatio(3, 3)).toBe(8);
});

test("centers bead codes between the half-pixel grid lines", () => {
  const texts: [string, number, number][] = [];
  const context = {
    fillStyle: "",
    fillText(text: string, x: number, y: number) {
      texts.push([text, x, y]);
    },
    font: "",
    textAlign: "start" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
  };

  drawVisibleBeadCodes({
    beads: [{ code: "A1", hex: "#fff8cc" }],
    cols: 1,
    context: context as Parameters<typeof drawVisibleBeadCodes>[0]["context"],
    rows: 1,
    view: { x: 0, y: 0, scale: 1 },
    viewport: { width: 100, height: 100 },
  });

  expect(texts).toEqual([["A1", 27.5, 27.5]]);
});
