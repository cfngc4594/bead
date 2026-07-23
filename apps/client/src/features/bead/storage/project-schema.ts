import {
  canvasSizeIdSchema,
  getCanvasSizeDefinition,
} from "@bead/core/canvas-sizes";
import {
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "@bead/core/canvas-snapshot";
import { z } from "zod";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();
export const projectSchema = z
  .object({
    id: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
    sizeId: canvasSizeIdSchema,
    snapshots: z.array(canvasSnapshotSchema).min(1),
    currentIndex: nonnegativeIntSchema,
    sourceDiscoverProjectId: z.uuid().optional(),
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
  const size = getCanvasSizeDefinition(project.sizeId);
  const cellCount = size.rows * size.cols;

  if (project.currentIndex >= project.snapshots.length) {
    addIssue({
      message: "currentIndex must point to an existing snapshot",
      path: ["currentIndex"],
    });
  }

  project.snapshots.forEach((snapshot, snapshotIndex) => {
    validateCanvasSnapshot({
      addIssue,
      cellCount,
      path: ["snapshots", snapshotIndex],
      snapshot,
    });
  });
}
export type Project = z.infer<typeof projectSchema>;
