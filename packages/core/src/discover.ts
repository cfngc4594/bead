import { z } from "zod";
import { canvasSizeIdSchema, getCanvasSizeDefinition } from "./canvas-sizes";
import {
  type CanvasSnapshotIssue,
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "./canvas-snapshot";

export const MAX_DISCOVER_PROJECTS_PER_PUBLISH = 60;

const discoverProjectContentSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    sizeId: canvasSizeIdSchema,
    snapshot: canvasSnapshotSchema,
  })
  .strict();

export const publishDiscoverProjectSchema =
  discoverProjectContentSchema.superRefine(addDiscoverProjectIssues);

export const publishDiscoverProjectsSchema = z
  .object({
    projects: z
      .array(publishDiscoverProjectSchema)
      .min(1)
      .max(MAX_DISCOVER_PROJECTS_PER_PUBLISH),
  })
  .strict();

export const discoverProjectSchema = discoverProjectContentSchema
  .extend({
    id: z.uuid(),
    publishedAt: z.number().int().nonnegative(),
  })
  .superRefine(addDiscoverProjectIssues);

const discoverCollectionContentSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
  })
  .strict();

export const publishDiscoverCollectionSchema =
  discoverCollectionContentSchema.extend({
    projects: z
      .array(publishDiscoverProjectSchema)
      .min(1)
      .max(MAX_DISCOVER_PROJECTS_PER_PUBLISH),
  });

export const discoverCollectionSchema = discoverCollectionContentSchema.extend({
  id: z.uuid(),
  publishedAt: z.number().int().nonnegative(),
  projects: z
    .array(discoverProjectSchema)
    .min(1)
    .max(MAX_DISCOVER_PROJECTS_PER_PUBLISH),
});

export type PublishDiscoverProject = z.infer<
  typeof publishDiscoverProjectSchema
>;
export type DiscoverProject = z.infer<typeof discoverProjectSchema>;
export type PublishDiscoverCollection = z.infer<
  typeof publishDiscoverCollectionSchema
>;
export type DiscoverCollection = z.infer<typeof discoverCollectionSchema>;

function addDiscoverProjectIssues(
  project: z.infer<typeof discoverProjectContentSchema>,
  ctx: { addIssue: (issue: { code: "custom" } & CanvasSnapshotIssue) => void },
) {
  const size = getCanvasSizeDefinition(project.sizeId);

  if (project.snapshot.cells.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "snapshot must contain at least one bead",
      path: ["snapshot", "cells"],
    });
  }

  validateCanvasSnapshot({
    addIssue: (issue) => ctx.addIssue({ code: "custom", ...issue }),
    cellCount: size.rows * size.cols,
    path: ["snapshot"],
    snapshot: project.snapshot,
  });
}
