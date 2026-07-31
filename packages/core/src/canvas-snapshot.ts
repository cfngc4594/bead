import { z } from "zod";
import {
  colorSchemeIdSchema,
  DEFAULT_COLOR_SCHEME_ID,
  getBeadColor,
  getColorScheme,
} from "./colors";

const nonnegativeIntSchema = z.number().int().nonnegative();

export const canvasSnapshotCellSchema = z.tuple([
  nonnegativeIntSchema,
  z.string().trim().min(1),
]);

export const canvasSnapshotSchema = z
  .object({
    colorSchemeId: colorSchemeIdSchema.default(DEFAULT_COLOR_SCHEME_ID),
    cells: z.array(canvasSnapshotCellSchema),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    if (!getColorScheme(snapshot.colorSchemeId)) {
      return;
    }

    snapshot.cells.forEach(([, code], index) => {
      if (!getBeadColor(snapshot.colorSchemeId, code)) {
        ctx.addIssue({
          code: "custom",
          message: "Unknown bead color code for the selected color scheme",
          path: ["cells", index, 1],
        });
      }
    });
  });

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
