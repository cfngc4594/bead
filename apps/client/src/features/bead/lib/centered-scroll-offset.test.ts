import { describe, expect, test } from "bun:test";
import { getCenteredScrollOffset } from "./centered-scroll-offset";

describe("getCenteredScrollOffset", () => {
  test("centers an item when there is room on both sides", () => {
    expect(
      getCenteredScrollOffset({
        itemOffset: 240,
        itemSize: 40,
        scrollSize: 600,
        viewportSize: 200,
      }),
    ).toBe(160);
  });

  test("clamps items near the start to the start edge", () => {
    expect(
      getCenteredScrollOffset({
        itemOffset: 8,
        itemSize: 40,
        scrollSize: 600,
        viewportSize: 200,
      }),
    ).toBe(0);
  });

  test("clamps items near the end to the end edge", () => {
    expect(
      getCenteredScrollOffset({
        itemOffset: 552,
        itemSize: 40,
        scrollSize: 600,
        viewportSize: 200,
      }),
    ).toBe(400);
  });

  test("does not scroll content smaller than its viewport", () => {
    expect(
      getCenteredScrollOffset({
        itemOffset: 80,
        itemSize: 40,
        scrollSize: 160,
        viewportSize: 200,
      }),
    ).toBe(0);
  });
});
