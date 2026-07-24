import { z } from "zod";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();

export const localCollectionSchema = z
  .object({
    id: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
    projectIds: z.array(nonEmptyStringSchema).min(2),
    createdAt: nonnegativeIntSchema,
    updatedAt: nonnegativeIntSchema,
  })
  .strict();

export type LocalCollection = z.infer<typeof localCollectionSchema>;
