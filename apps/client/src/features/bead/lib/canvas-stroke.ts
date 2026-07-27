import type { GridCell } from "@/features/bead/types";

export function getGridLineCells(start: GridCell, end: GridCell) {
  const cells: GridCell[] = [];
  let column = start.column;
  let row = start.row;
  const columnDistance = Math.abs(end.column - start.column);
  const rowDistance = Math.abs(end.row - start.row);
  const columnStep = start.column < end.column ? 1 : -1;
  const rowStep = start.row < end.row ? 1 : -1;
  let error = columnDistance - rowDistance;

  while (true) {
    cells.push({ row, column });

    if (column === end.column && row === end.row) {
      return cells;
    }

    const doubledError = error * 2;

    if (doubledError > -rowDistance) {
      error -= rowDistance;
      column += columnStep;
    }

    if (doubledError < columnDistance) {
      error += columnDistance;
      row += rowStep;
    }
  }
}
