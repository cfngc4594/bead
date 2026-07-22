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

export const discoverProjectRowSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1).max(80),
    size_id: canvasSizeIdSchema,
    rows: z.number().int().positive(),
    cols: z.number().int().positive(),
    snapshot: canvasSnapshotSchema,
    published_at: z.string().datetime({ offset: true }),
  })
  .strict()
  .transform((row) => ({
    id: row.id,
    title: row.title,
    sizeId: row.size_id,
    rows: row.rows,
    cols: row.cols,
    snapshot: row.snapshot,
    publishedAt: Date.parse(row.published_at),
  }));

export type DiscoverProject = z.infer<typeof discoverProjectRowSchema>;
export type PublishDiscoverProject = z.infer<
  typeof publishDiscoverProjectSchema
>;
