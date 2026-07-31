import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { colorSchemeIdSchema } from "@bead/core/colors";
import { z } from "zod";

export const beadFillSchema = z
  .object({
    code: z.string(),
    hex: z.string(),
  })
  .strict();

const beadStatSchema = beadFillSchema
  .extend({
    count: z.number(),
  })
  .strict();

export const beadTemplateSchema = z
  .object({
    version: z.literal(1),
    type: z.literal("bead-template"),
    createdAt: z.string(),
    title: z.string(),
    palette: colorSchemeIdSchema,
    size: z
      .object({
        id: canvasSizeIdSchema,
        title: z.string(),
        rows: z.number(),
        cols: z.number(),
      })
      .strict(),
    beads: z.array(z.union([z.null(), beadFillSchema])),
    stats: z.array(beadStatSchema),
  })
  .strict();

export type BeadTemplateFile = z.infer<typeof beadTemplateSchema>;
