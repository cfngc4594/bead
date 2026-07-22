import { z } from "zod";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();

export const canvasSnapshotCellSchema = z.tuple([
  nonnegativeIntSchema,
  nonEmptyStringSchema,
]);

export const canvasSnapshotSchema = z
  .object({
    cells: z.array(canvasSnapshotCellSchema),
  })
  .strict();

export type CanvasSnapshotCell = z.infer<typeof canvasSnapshotCellSchema>;
export type CanvasSnapshot = z.infer<typeof canvasSnapshotSchema>;

export type CanvasSnapshotIssue = {
  message: string;
  path: (number | string)[];
};

export function validateCanvasSnapshot({
  addIssue,
  cellCount,
  path,
  snapshot,
}: {
  addIssue: (issue: CanvasSnapshotIssue) => void;
  cellCount: number;
  path: (number | string)[];
  snapshot: CanvasSnapshot;
}) {
  const cellIndexes = new Set<number>();

  snapshot.cells.forEach(([beadIndex], cellIndex) => {
    if (beadIndex >= cellCount) {
      addIssue({
        message: "cell index must be within the canvas",
        path: [...path, "cells", cellIndex, 0],
      });
    }

    if (cellIndexes.has(beadIndex)) {
      addIssue({
        message: "cell indexes must be unique within a snapshot",
        path: [...path, "cells", cellIndex, 0],
      });
    }

    cellIndexes.add(beadIndex);
  });
}
