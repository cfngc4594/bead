import { expect, test } from "bun:test";
import { getFloodFillCells } from "@/features/bead/lib/canvas-flood-fill";
import type { BeadFill, GridCell } from "@/features/bead/types";

const colorA = { code: "A1", hex: "#fff8cc" };
const colorB = { code: "B1", hex: "#ffd500" };

test("finds an empty region enclosed by beads", () => {
  const beads = [
    colorA,
    colorA,
    colorA,
    colorA,
    null,
    colorA,
    colorA,
    colorA,
    colorA,
  ];

  expectRegion(beads, 3, 3, { row: 1, column: 1 }, [{ row: 1, column: 1 }]);
});

test("finds an empty region that reaches the canvas edge", () => {
  expectRegion([null, null, null, null], 2, 2, { row: 0, column: 0 }, [
    { row: 0, column: 0 },
    { row: 0, column: 1 },
    { row: 1, column: 0 },
    { row: 1, column: 1 },
  ]);
});

test("finds only the connected region with the clicked bead color", () => {
  const beads = [colorA, colorA, colorB, colorA, colorB, colorB];

  expectRegion(beads, 2, 3, { row: 0, column: 0 }, [
    { row: 0, column: 0 },
    { row: 0, column: 1 },
    { row: 1, column: 0 },
  ]);
});

test("does not connect regions that touch only at a corner", () => {
  const beads = [null, colorA, colorA, null];

  expectRegion(beads, 2, 2, { row: 0, column: 0 }, [{ row: 0, column: 0 }]);
});

test("does not mutate the canvas", () => {
  const beads = [null, colorA, null];
  const before = [...beads];

  getFloodFillCells({
    beads,
    rows: 1,
    cols: 3,
    startCell: { row: 0, column: 0 },
  });

  expect(beads).toEqual(before);
});

function expectRegion(
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
  startCell: GridCell,
  expected: readonly GridCell[],
) {
  const actual = getFloodFillCells({ beads, rows, cols, startCell });
  const toKey = ({ row, column }: GridCell) => `${row}:${column}`;

  expect(actual.map(toKey).sort()).toEqual(expected.map(toKey).sort());
}
