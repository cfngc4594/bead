import { describe, expect, test } from "bun:test";
import {
  localCollectionItemSchema,
  localCollectionSchema,
} from "@/features/collections/storage/collection-schema";

describe("localCollectionSchema", () => {
  test("accepts collection metadata", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "Flowers",
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
        collectionId: "collection-1",
        projectId: "project-1",
        position: 0,
      }).success,
    ).toBe(true);
  });

  test("rejects negative positions", () => {
    expect(
      localCollectionItemSchema.safeParse({
        collectionId: "collection-1",
        projectId: "project-1",
        position: -1,
      }).success,
    ).toBe(false);
  });
});
