import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";
import type { ProjectV2 } from "./types";

const canvasSnapshotCellSchema = z.union([
  z.tuple([z.number(), z.string()]),
  z.tuple([z.number(), z.string(), z.number()]),
]);

const canvasSnapshotLayerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    h: z.literal(1).optional(),
    k: z.literal(1).optional(),
  })
  .strict();

const canvasSnapshotSchema = z
  .object({
    v: z.literal(2),
    c: z.array(canvasSnapshotCellSchema),
    l: z.array(canvasSnapshotLayerSchema),
    a: z.string(),
  })
  .strict();

export const projectV2Schema = z
  .object({
    id: z.string(),
    title: z.string(),
    sizeId: canvasSizeIdSchema,
    rows: z.number(),
    cols: z.number(),
    snapshots: z.array(canvasSnapshotSchema),
    currentIndex: z.number(),
    updatedAt: z.number(),
  })
  .strict();

export function isProjectV2(value: unknown): value is ProjectV2 {
  return projectV2Schema.safeParse(value).success;
}

export function parseProjectV2(value: unknown) {
  return projectV2Schema.safeParse(value).data ?? null;
}
