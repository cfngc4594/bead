import { describe, expect, test } from "bun:test";
import { publishDiscoverProjectSchema } from "./discover";

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
