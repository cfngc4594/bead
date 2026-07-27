import { expect, test } from "bun:test";
import {
  type BoardDrawingContext,
  drawBoard,
} from "@/features/bead/lib/canvas-drawing";
import { cellSize } from "@/features/bead/lib/canvas-geometry";

test("draws a clean pattern preview without labels, codes, or grid lines", () => {
  const fillRects: [number, number, number, number][] = [];
  let fillTextCount = 0;
  let strokeRectCount = 0;
  const context = {
    beginPath() {},
    fillRect(x: number, y: number, width: number, height: number) {
      fillRects.push([x, y, width, height]);
    },
    fillStyle: "",
    fillText() {
      fillTextCount += 1;
    },
    font: "",
    lineTo() {},
    lineWidth: 1,
    moveTo() {},
    restore() {},
    save() {},
    stroke() {},
    strokeRect() {
      strokeRectCount += 1;
    },
    strokeStyle: "",
    textAlign: "start",
    textBaseline: "alphabetic",
  } satisfies BoardDrawingContext;

  drawBoard(context, 1, 1, [{ code: "A1", hex: "#123456" }], {
    showBeadCodes: false,
    showGrid: false,
    showLabels: false,
  });

  expect(fillRects).toEqual([[0, 0, cellSize, cellSize]]);
  expect(fillTextCount).toBe(0);
  expect(strokeRectCount).toBe(0);
});

test("leaves empty cells transparent in preview mode", () => {
  const fillRects: [number, number, number, number][] = [];
  const context = {
    beginPath() {},
    fillRect(x: number, y: number, width: number, height: number) {
      fillRects.push([x, y, width, height]);
    },
    fillStyle: "",
    fillText() {},
    font: "",
    lineTo() {},
    lineWidth: 1,
    moveTo() {},
    restore() {},
    save() {},
    stroke() {},
    strokeRect() {},
    strokeStyle: "",
    textAlign: "start",
    textBaseline: "alphabetic",
  } satisfies BoardDrawingContext;

  drawBoard(context, 1, 1, [null], {
    showBeadCodes: false,
    showGrid: false,
    showLabels: false,
  });

  expect(fillRects).toEqual([]);
});

test("centers labels and bead codes between their half-pixel borders", () => {
  const texts: [string, number, number][] = [];
  const context = {
    beginPath() {},
    fillRect() {},
    fillStyle: "",
    fillText(text: string, x: number, y: number) {
      texts.push([text, x, y]);
    },
    font: "",
    lineTo() {},
    lineWidth: 1,
    moveTo() {},
    restore() {},
    save() {},
    stroke() {},
    strokeRect() {},
    strokeStyle: "",
    textAlign: "start",
    textBaseline: "alphabetic",
  } satisfies BoardDrawingContext;

  drawBoard(context, 1, 1, [{ code: "A1", hex: "#123456" }]);

  expect(texts).toEqual([
    ["1", 27.5, 9.5],
    ["1", 27.5, 45.5],
    ["1", 9.5, 27.5],
    ["1", 45.5, 27.5],
    ["A1", 27.5, 27.5],
  ]);
});
