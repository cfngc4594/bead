import { describe, expect, test } from "bun:test";
import { canvasSnapshotSchema } from "./canvas-snapshot";

describe("canvasSnapshotSchema", () => {
  test("assigns the default scheme to legacy snapshots", () => {
    expect(canvasSnapshotSchema.parse({ cells: [[0, "A1"]] })).toEqual({
      colorSchemeId: "mard-291",
      cells: [[0, "A1"]],
    });
  });

  test("normalizes the legacy MARD scheme alias", () => {
    expect(
      canvasSnapshotSchema.parse({
        colorSchemeId: "mard",
        cells: [[0, "A1"]],
      }).colorSchemeId,
    ).toBe("mard-291");
  });

  test("validates scheme and color references together", () => {
    expect(
      canvasSnapshotSchema.safeParse({
        colorSchemeId: "missing",
        cells: [[0, "A1"]],
      }).success,
    ).toBe(false);
    expect(
      canvasSnapshotSchema.safeParse({
        colorSchemeId: "mard-291",
        cells: [[0, "missing"]],
      }).success,
    ).toBe(false);
    expect(
      canvasSnapshotSchema.safeParse({
        colorSchemeId: "mard-221",
        cells: [[0, "P1"]],
      }).success,
    ).toBe(false);
  });
});
