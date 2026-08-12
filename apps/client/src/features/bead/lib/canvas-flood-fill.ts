import type { BeadFill, GridCell } from "@/features/bead/types";

export function getFloodFillCells({
  beads,
  rows,
  cols,
  startCell,
}: {
  beads: readonly (BeadFill | null)[];
  rows: number;
  cols: number;
  startCell: GridCell;
}) {
  const startIndex = startCell.row * cols + startCell.column;
  const targetCode = beads[startIndex]?.code ?? null;
  const visited = new Uint8Array(beads.length);
  const queue = [startIndex];
  const cells: GridCell[] = [];
  visited[startIndex] = 1;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const row = Math.floor(index / cols);
    const column = index % cols;
    cells.push({ row, column });

    visitNeighbor(index - cols, row > 0);
    visitNeighbor(index + cols, row < rows - 1);
    visitNeighbor(index - 1, column > 0);
    visitNeighbor(index + 1, column < cols - 1);
  }

  return cells;

  function visitNeighbor(index: number, isInBounds: boolean) {
    if (
      !isInBounds ||
      visited[index] ||
      (beads[index]?.code ?? null) !== targetCode
    ) {
      return;
    }

    visited[index] = 1;
    queue.push(index);
  }
}
