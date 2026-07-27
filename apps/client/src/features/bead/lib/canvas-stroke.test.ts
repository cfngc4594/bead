import { expect, test } from "bun:test";
import { getGridLineCells } from "@/features/bead/lib/canvas-stroke";

test("returns one cell for a stationary pointer", () => {
  expect(
    getGridLineCells({ row: 2, column: 3 }, { row: 2, column: 3 }),
  ).toEqual([{ row: 2, column: 3 }]);
});

test("fills horizontal and vertical gaps in both directions", () => {
  expect(
    getGridLineCells({ row: 1, column: 1 }, { row: 1, column: 4 }),
  ).toEqual([
    { row: 1, column: 1 },
    { row: 1, column: 2 },
    { row: 1, column: 3 },
    { row: 1, column: 4 },
  ]);
  expect(
    getGridLineCells({ row: 4, column: 2 }, { row: 1, column: 2 }),
  ).toEqual([
    { row: 4, column: 2 },
    { row: 3, column: 2 },
    { row: 2, column: 2 },
    { row: 1, column: 2 },
  ]);
});

test("creates continuous shallow, steep, and reverse diagonal lines", () => {
  const lines = [
    getGridLineCells({ row: 0, column: 0 }, { row: 3, column: 7 }),
    getGridLineCells({ row: 0, column: 0 }, { row: 7, column: 3 }),
    getGridLineCells({ row: 7, column: 5 }, { row: 1, column: 0 }),
  ];

  for (const cells of lines) {
    for (let index = 1; index < cells.length; index += 1) {
      const previous = cells[index - 1];
      const current = cells[index];

      expect(Math.abs(current.row - previous.row)).toBeLessThanOrEqual(1);
      expect(Math.abs(current.column - previous.column)).toBeLessThanOrEqual(1);
    }
  }
});
