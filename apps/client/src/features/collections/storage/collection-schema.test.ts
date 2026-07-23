import { describe, expect, test } from "bun:test";
import {
  localCollectionItemSchema,
  localCollectionSchema,
} from "@/features/collections/storage/collection-schema";

describe("localCollectionSchema", () => {
  test("accepts local and imported collections", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "Flowers",
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(true);
    expect(
      localCollectionSchema.safeParse({
        id: "collection-2",
        title: "Animals",
        sourceDiscoverCollectionId: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(true);
  });

  test("rejects invalid collection metadata", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "",
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(false);
  });
});

describe("localCollectionItemSchema", () => {
  test("accepts an ordered project membership", () => {
    expect(
      localCollectionItemSchema.safeParse({
        id: "item-1",
        collectionId: "collection-1",
        projectId: "project-1",
        position: 0,
        addedAt: 1,
      }).success,
    ).toBe(true);
  });

  test("rejects negative positions", () => {
    expect(
      localCollectionItemSchema.safeParse({
        id: "item-1",
        collectionId: "collection-1",
        projectId: "project-1",
        position: -1,
        addedAt: 1,
      }).success,
    ).toBe(false);
  });
});
