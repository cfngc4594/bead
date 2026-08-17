import { z } from "zod";
import { canvasSizeIdSchema, getCanvasSizeDefinition } from "./canvas-sizes";
import {
  type CanvasSnapshotIssue,
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "./canvas-snapshot";

export const MAX_DISCOVER_FEED_PAGE_SIZE = 60;

const discoverProjectContentSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    sizeId: canvasSizeIdSchema,
    snapshot: canvasSnapshotSchema,
  })
  .strict();

export const publishDiscoverProjectSchema =
  discoverProjectContentSchema.superRefine(addDiscoverProjectIssues);

export const publishDiscoverProjectBodySchema = z
  .object({
    project: publishDiscoverProjectSchema,
  })
  .strict();

export const discoverProjectSchema = discoverProjectContentSchema
  .extend({
    id: z.uuid(),
    publishedAt: z.number().int().nonnegative(),
  })
  .superRefine(addDiscoverProjectIssues);

export const discoverProjectListItemSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(1).max(80),
    sizeId: canvasSizeIdSchema,
    publishedAt: z.number().int().nonnegative(),
    thumbnailUrl: z.string().min(1),
  })
  .strict();

export type PublishDiscoverProject = z.infer<
  typeof publishDiscoverProjectSchema
>;
export type DiscoverProject = z.infer<typeof discoverProjectSchema>;
export type DiscoverProjectListItem = z.infer<
  typeof discoverProjectListItemSchema
>;

function addDiscoverProjectIssues(
  project: Pick<
    z.infer<typeof discoverProjectContentSchema>,
    "sizeId" | "snapshot"
  >,
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
