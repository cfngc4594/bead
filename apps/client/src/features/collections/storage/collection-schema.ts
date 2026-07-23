import { z } from "zod";

const nonEmptyStringSchema = z.string().min(1);
const nonnegativeIntSchema = z.number().int().nonnegative();

export const localCollectionSchema = z
  .object({
    id: nonEmptyStringSchema,
    title: nonEmptyStringSchema,
    sourceDiscoverCollectionId: z.uuid().optional(),
    createdAt: nonnegativeIntSchema,
    updatedAt: nonnegativeIntSchema,
  })
  .strict();

export const localCollectionItemSchema = z
  .object({
    id: nonEmptyStringSchema,
    collectionId: nonEmptyStringSchema,
    projectId: nonEmptyStringSchema,
    position: nonnegativeIntSchema,
    addedAt: nonnegativeIntSchema,
  })
  .strict();

export type LocalCollection = z.infer<typeof localCollectionSchema>;
export type LocalCollectionItem = z.infer<typeof localCollectionItemSchema>;
