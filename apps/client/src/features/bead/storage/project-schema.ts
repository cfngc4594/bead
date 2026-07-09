import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();
const positiveIntSchema = z.number().int().positive();

export const canvasSnapshotCellSchema = z.tuple([
  nonnegativeIntSchema,
  nonEmptyStringSchema,
]);

export const canvasSnapshotSchema = z
  .object({
    cells: z.array(canvasSnapshotCellSchema),
  })
  .strict();

export const projectSchema = z
  .object({
    id: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
    sizeId: canvasSizeIdSchema,
    rows: positiveIntSchema,
    cols: positiveIntSchema,
    snapshots: z.array(canvasSnapshotSchema).min(1),
    currentIndex: nonnegativeIntSchema,
    updatedAt: nonnegativeIntSchema,
  })
  .strict();

export const projectIntegritySchema = projectSchema.superRefine(
  (project, ctx) => {
    validateProjectIntegrity(project, (issue) =>
      ctx.addIssue({ code: "custom", ...issue }),
    );
  },
);

export type ProjectIntegrityIssue = {
  message: string;
  path: (number | string)[];
};

export function validateProjectIntegrity(
  project: Project,
  addIssue: (issue: ProjectIntegrityIssue) => void,
) {
  const cellCount = project.rows * project.cols;

  if (project.currentIndex >= project.snapshots.length) {
    addIssue({
      message: "currentIndex must point to an existing snapshot",
      path: ["currentIndex"],
    });
  }

  project.snapshots.forEach((snapshot, snapshotIndex) => {
    const cellIndexes = new Set<number>();

    snapshot.cells.forEach(([beadIndex], cellIndex) => {
      if (beadIndex >= cellCount) {
        addIssue({
          message: "cell index must be within the project canvas",
          path: ["snapshots", snapshotIndex, "cells", cellIndex, 0],
        });
      }

      if (cellIndexes.has(beadIndex)) {
        addIssue({
          message: "cell indexes must be unique within a snapshot",
          path: ["snapshots", snapshotIndex, "cells", cellIndex, 0],
        });
      }

      cellIndexes.add(beadIndex);
    });
  });
}

export type CanvasSnapshotCell = z.infer<typeof canvasSnapshotCellSchema>;
export type CanvasSnapshot = z.infer<typeof canvasSnapshotSchema>;
export type Project = z.infer<typeof projectSchema>;
