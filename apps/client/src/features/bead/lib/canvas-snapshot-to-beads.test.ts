import { describe, expect, test } from "bun:test";
import { canvasSnapshotToBeads } from "./canvas-snapshot-to-beads";

describe("canvasSnapshotToBeads", () => {
  test("expands compact cells into canvas state", () => {
    expect(
      canvasSnapshotToBeads(
        {
          cells: [
            [0, "H7"],
            [2, "A1"],
          ],
        },
        3,
      ),
    ).toEqual([
      { code: "H7", hex: "#000000" },
      null,
      { code: "A1", hex: "#FAF4C8" },
    ]);
  });

  test("rejects invalid server snapshots instead of dropping cells", () => {
    expect(() => canvasSnapshotToBeads({ cells: [[2, "H7"]] }, 2)).toThrow(
      "Canvas snapshot index is out of range",
    );
    expect(() => canvasSnapshotToBeads({ cells: [[0, "unknown"]] }, 1)).toThrow(
      "Canvas snapshot contains an unknown color",
    );
  });
});
