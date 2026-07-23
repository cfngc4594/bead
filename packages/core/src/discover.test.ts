import { describe, expect, test } from "bun:test";
import {
  MAX_DISCOVER_PROJECTS_PER_PUBLISH,
  publishDiscoverCollectionSchema,
  publishDiscoverProjectSchema,
} from "./discover";

describe("publishDiscoverProjectSchema", () => {
  test("accepts an independent discover snapshot", () => {
    expect(publishDiscoverProjectSchema.parse(createPublishInput())).toEqual(
      createPublishInput(),
    );
  });

  test("rejects duplicate and out-of-range cells", () => {
    expect(
      publishDiscoverProjectSchema.safeParse(
        createPublishInput({
          snapshot: {
            cells: [
              [0, "A1"],
              [0, "B2"],
              [256, "C3"],
            ],
          },
        }),
      ).success,
    ).toBe(false);
  });

  test("rejects bead color codes outside the shared catalog", () => {
    expect(
      publishDiscoverProjectSchema.safeParse(
        createPublishInput({ snapshot: { cells: [[0, "UNKNOWN"]] } }),
      ).success,
    ).toBe(false);
  });

  test("rejects an empty snapshot", () => {
    expect(
      publishDiscoverProjectSchema.safeParse(
        createPublishInput({ snapshot: { cells: [] } }),
      ).success,
    ).toBe(false);
  });
});

describe("publishDiscoverCollectionSchema", () => {
  test("accepts an ordered collection of project snapshots", () => {
    const input = {
      title: "Spring set",
      projects: [
        createPublishInput({ title: "Rabbit" }),
        createPublishInput({ title: "Flower" }),
      ],
    };

    expect(publishDiscoverCollectionSchema.parse(input)).toEqual(input);
  });

  test("requires at least one valid project", () => {
    expect(
      publishDiscoverCollectionSchema.safeParse({
        title: "Empty set",
        projects: [],
      }).success,
    ).toBe(false);
  });

  test("enforces the shared publish limit", () => {
    expect(
      publishDiscoverCollectionSchema.safeParse({
        title: "Large set",
        projects: Array.from(
          { length: MAX_DISCOVER_PROJECTS_PER_PUBLISH + 1 },
          () => createPublishInput(),
        ),
      }).success,
    ).toBe(false);
  });
});

function createPublishInput(
  overrides: Partial<ReturnType<typeof createBasePublishInput>> = {},
) {
  return {
    ...createBasePublishInput(),
    ...overrides,
  };
}

function createBasePublishInput() {
  return {
    title: "Demo",
    sizeId: "16x16" as const,
    snapshot: { cells: [[0, "A1"]] as [number, string][] },
  };
}
