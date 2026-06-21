import { cellSize, getGridOrigin } from "@/features/bead/lib/canvas-geometry";
import type { BeadFill, GridCell } from "@/features/bead/types";

export type BeadSelection = {
  origin: GridCell;
  rows: number;
  cols: number;
  items: BeadSelectionItem[];
};

export type BeadSelectionItem = {
  rowOffset: number;
  columnOffset: number;
  fill: BeadFill;
};

export type BeadSelectionBox = {
  start: GridCell;
  end: GridCell;
};

export function getSelectionFromBox(
  box: BeadSelectionBox,
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
) {
  const bounds = normalizeSelectionBox(box);
  const items: BeadSelectionItem[] = [];

  for (let rowOffset = 0; rowOffset < bounds.rows; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < bounds.cols; columnOffset += 1) {
      const row = bounds.origin.row + rowOffset;
      const column = bounds.origin.column + columnOffset;

      if (row < 0 || row >= rows || column < 0 || column >= cols) {
        continue;
      }

      const fill = beads[row * cols + column];

      if (fill) {
        items.push({ rowOffset, columnOffset, fill });
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  return {
    ...bounds,
    items,
  };
}

export function getSelectionBoxRect(box: BeadSelectionBox) {
  return getSelectionRect(normalizeSelectionBox(box));
}

export function getSelectionRect(
  selection: Pick<BeadSelection, "origin" | "rows" | "cols">,
  origin = selection.origin,
) {
  const gridOrigin = getGridOrigin();

  return {
    x: gridOrigin.x + origin.column * cellSize + 0.5,
    y: gridOrigin.y + origin.row * cellSize + 0.5,
    width: selection.cols * cellSize,
    height: selection.rows * cellSize,
  };
}

export function isCellInSelection(cell: GridCell, selection: BeadSelection) {
  return (
    cell.row >= selection.origin.row &&
    cell.row < selection.origin.row + selection.rows &&
    cell.column >= selection.origin.column &&
    cell.column < selection.origin.column + selection.cols
  );
}

export function getMovedSelectionOrigin(
  selection: BeadSelection,
  moveStartCell: GridCell,
  currentCell: GridCell,
) {
  return {
    row: selection.origin.row + currentCell.row - moveStartCell.row,
    column: selection.origin.column + currentCell.column - moveStartCell.column,
  };
}

export function isSelectionInBounds(
  selection: BeadSelection,
  origin: GridCell,
  rows: number,
  cols: number,
) {
  return (
    origin.row >= 0 &&
    origin.column >= 0 &&
    origin.row + selection.rows <= rows &&
    origin.column + selection.cols <= cols
  );
}

export function moveSelectedBeads(
  beads: readonly (BeadFill | null)[],
  selection: BeadSelection,
  targetOrigin: GridCell,
  cols: number,
) {
  const next = [...beads];

  for (const item of selection.items) {
    const sourceRow = selection.origin.row + item.rowOffset;
    const sourceColumn = selection.origin.column + item.columnOffset;

    next[sourceRow * cols + sourceColumn] = null;
  }

  for (const item of selection.items) {
    const targetRow = targetOrigin.row + item.rowOffset;
    const targetColumn = targetOrigin.column + item.columnOffset;

    next[targetRow * cols + targetColumn] = item.fill;
  }

  return next;
}

export function hideSelectedBeads(
  beads: readonly (BeadFill | null)[],
  selection: BeadSelection,
  cols: number,
) {
  const next = [...beads];

  for (const item of selection.items) {
    const sourceRow = selection.origin.row + item.rowOffset;
    const sourceColumn = selection.origin.column + item.columnOffset;

    next[sourceRow * cols + sourceColumn] = null;
  }

  return next;
}

export function isSameCell(a: GridCell, b: GridCell) {
  return a.row === b.row && a.column === b.column;
}

function normalizeSelectionBox({ start, end }: BeadSelectionBox) {
  const row = Math.min(start.row, end.row);
  const column = Math.min(start.column, end.column);
  const lastRow = Math.max(start.row, end.row);
  const lastColumn = Math.max(start.column, end.column);

  return {
    origin: { row, column },
    rows: lastRow - row + 1,
    cols: lastColumn - column + 1,
  };
}
