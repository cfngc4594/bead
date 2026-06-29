import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";
import { projectV0SnapshotCellSchema } from "../v0/schema";
import type { ProjectV1 } from "./types";

export const projectV1SnapshotCellSchema = projectV0SnapshotCellSchema;

export const projectV1Schema = z
  .object({
    id: z.string(),
    title: z.string(),
    sizeId: canvasSizeIdSchema,
    rows: z.number(),
    cols: z.number(),
    snapshots: z.array(z.array(projectV1SnapshotCellSchema)),
    currentIndex: z.number(),
    updatedAt: z.number(),
  })
  .strict();

export function isProjectV1(value: unknown): value is ProjectV1 {
  return projectV1Schema.safeParse(value).success;
}

export function parseProjectV1(value: unknown) {
  return projectV1Schema.safeParse(value).data ?? null;
}
