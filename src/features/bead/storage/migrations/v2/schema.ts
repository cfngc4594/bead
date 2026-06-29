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
    isHidden: z.literal(true).optional(),
    isLocked: z.literal(true).optional(),
  })
  .strict();

const canvasSnapshotSchema = z
  .object({
    version: z.literal(2),
    cells: z.array(canvasSnapshotCellSchema),
    layers: z.array(canvasSnapshotLayerSchema),
    activeLayerId: z.string(),
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
