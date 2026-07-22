import { z } from "zod";
import { canvasSizeIdSchema, getCanvasSizeDefinition } from "./canvas-sizes";
import {
  type CanvasSnapshotIssue,
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "./canvas-snapshot";

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
    projects: z.array(publishDiscoverProjectSchema).min(1),
  })
  .strict();

export const discoverProjectSchema = discoverProjectContentSchema
  .extend({
    id: z.uuid(),
    publishedAt: z.number().int().nonnegative(),
  })
  .superRefine(addDiscoverProjectIssues);

export type PublishDiscoverProject = z.infer<
  typeof publishDiscoverProjectSchema
>;
export type DiscoverProject = z.infer<typeof discoverProjectSchema>;

function addDiscoverProjectIssues(
  project: z.infer<typeof discoverProjectContentSchema>,
  ctx: { addIssue: (issue: { code: "custom" } & CanvasSnapshotIssue) => void },
) {
  const size = getCanvasSizeDefinition(project.sizeId);

  validateCanvasSnapshot({
    addIssue: (issue) => ctx.addIssue({ code: "custom", ...issue }),
    cellCount: size.rows * size.cols,
    path: ["snapshot"],
    snapshot: project.snapshot,
  });
}
