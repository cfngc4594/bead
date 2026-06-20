import { z } from "zod";

const beadFillSchema = z.object({
  code: z.string(),
  hex: z.string(),
});

const beadStatSchema = beadFillSchema.extend({
  count: z.number(),
});

export const beadTemplateSchema = z.object({
  version: z.literal(1),
  type: z.literal("bead-template"),
  createdAt: z.string(),
  title: z.string(),
  palette: z.literal("mard"),
  size: z.object({
    id: z.string(),
    title: z.string(),
    rows: z.number(),
    cols: z.number(),
  }),
  beads: z.array(z.union([z.null(), beadFillSchema])),
  stats: z.array(beadStatSchema),
});

export type BeadTemplateFile = z.infer<typeof beadTemplateSchema>;
