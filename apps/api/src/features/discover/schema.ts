import {
  canvasSizeDefinitions,
  canvasSizeIdSchema,
} from "@bead/core/canvas-sizes";
import {
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "@bead/core/canvas-snapshot";
import { z } from "zod";

export const publishDiscoverProjectSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    sizeId: canvasSizeIdSchema,
    rows: z.number().int().positive(),
    cols: z.number().int().positive(),
    snapshot: canvasSnapshotSchema,
  })
  .strict()
  .superRefine((project, ctx) => {
    const size = canvasSizeDefinitions[project.sizeId];

    if (project.rows !== size.rows) {
      ctx.addIssue({
        code: "custom",
        message: "rows must match sizeId",
        path: ["rows"],
      });
    }

    if (project.cols !== size.cols) {
      ctx.addIssue({
        code: "custom",
        message: "cols must match sizeId",
        path: ["cols"],
      });
    }

    validateCanvasSnapshot({
      addIssue: (issue) => {
        ctx.addIssue({ code: "custom", ...issue });
      },
      cellCount: project.rows * project.cols,
      path: ["snapshot"],
      snapshot: project.snapshot,
    });
  });

export const publishDiscoverProjectsSchema = z
  .object({
    projects: z.array(publishDiscoverProjectSchema).min(1),
  })
  .strict();

export const discoverProjectParamSchema = z.object({
  projectId: z.uuid(),
});

export type PublishDiscoverProject = z.infer<
  typeof publishDiscoverProjectSchema
>;
export type DiscoverProject = PublishDiscoverProject & {
  id: string;
  publishedAt: number;
};
