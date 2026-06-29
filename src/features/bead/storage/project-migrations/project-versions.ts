import { z } from "zod";
import { canvasSizeIdSchema } from "@/config/canvas-sizes";

const beadFillSchema = z
  .object({
    code: z.string(),
    hex: z.string(),
  })
  .strict();

const projectV0SnapshotCellSchema = z
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

const projectV1SnapshotCellSchema = projectV0SnapshotCellSchema;

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

export type ProjectV0SnapshotCell = z.infer<typeof projectV0SnapshotCellSchema>;
export type ProjectV0 = z.infer<typeof projectV0Schema>;
export type ProjectV1SnapshotCell = z.infer<typeof projectV1SnapshotCellSchema>;
export type ProjectV1 = z.infer<typeof projectV1Schema>;
export type ProjectV2 = z.infer<typeof projectV2Schema>;

export function isProjectV0(value: unknown): value is ProjectV0 {
  return projectV0Schema.safeParse(value).success;
}

export function parseProjectV0(value: unknown) {
  return projectV0Schema.safeParse(value).data ?? null;
}

export function isProjectV1(value: unknown): value is ProjectV1 {
  return projectV1Schema.safeParse(value).success;
}

export function parseProjectV1(value: unknown) {
  return projectV1Schema.safeParse(value).data ?? null;
}

export function isProjectV2(value: unknown): value is ProjectV2 {
  return projectV2Schema.safeParse(value).success;
}

export function parseProjectV2(value: unknown) {
  return projectV2Schema.safeParse(value).data ?? null;
}
