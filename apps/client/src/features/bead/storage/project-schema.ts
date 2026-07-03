import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();
const positiveIntSchema = z.number().int().positive();

export const canvasSnapshotCellSchema = z.tuple([
  nonnegativeIntSchema,
  nonEmptyStringSchema,
  nonnegativeIntSchema,
]);

export const canvasSnapshotLayerSchema = z
  .object({
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    isHidden: z.literal(true).optional(),
    isLocked: z.literal(true).optional(),
  })
  .strict();

export const canvasSnapshotSchema = z
  .object({
    cells: z.array(canvasSnapshotCellSchema),
    layers: z.array(canvasSnapshotLayerSchema).min(1),
    activeLayerId: nonEmptyStringSchema,
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
    const layerIds = new Set<string>();
    const cellIndexes = new Set<number>();

    snapshot.layers.forEach((layer, layerIndex) => {
      if (layerIds.has(layer.id)) {
        addIssue({
          message: "layer ids must be unique within a snapshot",
          path: ["snapshots", snapshotIndex, "layers", layerIndex, "id"],
        });
      }

      layerIds.add(layer.id);
    });

    if (!layerIds.has(snapshot.activeLayerId)) {
      addIssue({
        message: "activeLayerId must point to an existing layer",
        path: ["snapshots", snapshotIndex, "activeLayerId"],
      });
    }

    snapshot.cells.forEach(([beadIndex, , layerIndex], cellIndex) => {
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

      if (layerIndex >= snapshot.layers.length) {
        addIssue({
          message: "cell layer index must point to an existing layer",
          path: ["snapshots", snapshotIndex, "cells", cellIndex, 2],
        });
      }
    });
  });
}

export type CanvasSnapshotCell = z.infer<typeof canvasSnapshotCellSchema>;
export type CanvasSnapshotLayer = z.infer<typeof canvasSnapshotLayerSchema>;
export type CanvasSnapshot = z.infer<typeof canvasSnapshotSchema>;
export type Project = z.infer<typeof projectSchema>;
