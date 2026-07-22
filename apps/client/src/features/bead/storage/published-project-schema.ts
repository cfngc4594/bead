import { z } from "zod";
import {
  canvasSnapshotSchema,
  projectBaseSchema,
  validateSnapshotIntegrity,
} from "@/features/bead/storage/project-schema";

const nonnegativeIntSchema = z.number().int().nonnegative();

export const publishedProjectSchema = projectBaseSchema
  .extend({
    snapshot: canvasSnapshotSchema,
    sourceUpdatedAt: nonnegativeIntSchema,
    publishedAt: nonnegativeIntSchema,
  })
  .superRefine((project, ctx) => {
    validateSnapshotIntegrity({
      addIssue: (issue) => ctx.addIssue({ code: "custom", ...issue }),
      cellCount: project.rows * project.cols,
      path: ["snapshot"],
      snapshot: project.snapshot,
    });
  });

export type PublishedProject = z.infer<typeof publishedProjectSchema>;
