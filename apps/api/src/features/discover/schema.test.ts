import { describe, expect, test } from "bun:test";
import {
  discoverProjectRowSchema,
  publishDiscoverProjectSchema,
} from "./schema.js";

describe("publishDiscoverProjectSchema", () => {
  test("accepts an independent discover snapshot", () => {
    expect(publishDiscoverProjectSchema.parse(createPublishInput())).toEqual(
      createPublishInput(),
    );
  });

  test("rejects mismatched dimensions", () => {
    expect(
      publishDiscoverProjectSchema.safeParse(createPublishInput({ rows: 29 }))
        .success,
    ).toBe(false);
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
});

test("discoverProjectRowSchema maps database columns to the API contract", () => {
  expect(
    discoverProjectRowSchema.parse({
      id: "bff3fbb4-0f6d-4e56-8fe4-a3c4daf5ebdd",
      title: "Demo",
      size_id: "16x16",
      rows: 16,
      cols: 16,
      snapshot: { cells: [[0, "A1"]] },
      published_at: "2026-07-22T08:00:00.000Z",
    }),
  ).toEqual({
    id: "bff3fbb4-0f6d-4e56-8fe4-a3c4daf5ebdd",
    title: "Demo",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshot: { cells: [[0, "A1"]] },
    publishedAt: Date.parse("2026-07-22T08:00:00.000Z"),
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
    rows: 16,
    cols: 16,
    snapshot: { cells: [[0, "A1"]] as [number, string][] },
  };
}
