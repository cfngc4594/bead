import { describe, expect, test } from "bun:test";
import { localCollectionSchema } from "@/features/collections/storage/collection-schema";

describe("localCollectionSchema", () => {
  test("accepts a collection with ordered project ids", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "Flowers",
        projectIds: ["project-1", "project-2"],
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(true);
  });

  test("rejects collections with fewer than two projects", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "Flowers",
        projectIds: ["project-1"],
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(false);
  });

  test("rejects blank titles", () => {
    expect(
      localCollectionSchema.safeParse({
        id: "collection-1",
        title: "",
        projectIds: ["project-1", "project-2"],
        createdAt: 1,
        updatedAt: 2,
      }).success,
    ).toBe(false);
  });
});
