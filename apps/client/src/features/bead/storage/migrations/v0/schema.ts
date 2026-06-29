import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";
import type { ProjectV0 } from "./types";

const beadFillSchema = z
  .object({
    code: z.string(),
    hex: z.string(),
  })
  .strict();

export const projectV0SnapshotCellSchema = z
  .object({
    index: z.number(),
    fill: beadFillSchema,
  })
  .strict();

export const projectV0Schema = z
  .object({
    id: z.string(),
    title: z.string(),
    sizeId: canvasSizeIdSchema,
    rows: z.number(),
    cols: z.number(),
    snapshots: z.array(z.array(projectV0SnapshotCellSchema)),
    currentIndex: z.number(),
    updatedAt: z.number(),
  })
  .strict();

export function isProjectV0(value: unknown): value is ProjectV0 {
  return projectV0Schema.safeParse(value).success;
}

export function parseProjectV0(value: unknown) {
  return projectV0Schema.safeParse(value).data ?? null;
}
