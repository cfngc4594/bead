import { z } from "zod";

export const canvasSizeIds = ["16x16", "29x29", "58x58", "87x87"] as const;

export const canvasSizeIdSchema = z.enum(canvasSizeIds);

export type CanvasSizeId = z.infer<typeof canvasSizeIdSchema>;

export const canvasSizeDefinitions = {
  "16x16": { id: "16x16", rows: 16, cols: 16 },
  "29x29": { id: "29x29", rows: 29, cols: 29 },
  "58x58": { id: "58x58", rows: 58, cols: 58 },
  "87x87": { id: "87x87", rows: 87, cols: 87 },
} as const satisfies Record<
  CanvasSizeId,
  { id: CanvasSizeId; rows: number; cols: number }
>;

export function getCanvasSizeDefinition(id: CanvasSizeId) {
  return canvasSizeDefinitions[id];
}
