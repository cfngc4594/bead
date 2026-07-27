import { expect, test } from "bun:test";
import { applyCanvasEdits } from "@/features/bead/lib/canvas-state";

test("applies an ordered edit batch with one new canvas array", () => {
  const original = [null, { code: "A1", hex: "#fff8cc" }, null];
  const fill = { code: "B1", hex: "#ffd500" };
  const next = applyCanvasEdits(original, [
    { index: 0, fill },
    { index: 1, fill: null },
  ]);

  expect(next).not.toBe(original);
  expect(next).toEqual([fill, null, null]);
  expect(original).toEqual([null, { code: "A1", hex: "#fff8cc" }, null]);
});

test("uses the last edit when a batch revisits a cell", () => {
  const original = [null];
  const next = applyCanvasEdits(original, [
    { index: 0, fill: { code: "A1", hex: "#fff8cc" } },
    { index: 0, fill: { code: "B1", hex: "#ffd500" } },
  ]);

  expect(next).toEqual([{ code: "B1", hex: "#ffd500" }]);
});

test("can erase and then restore the original fill in one batch", () => {
  const originalFill = { code: "A1", hex: "#fff8cc" };
  const next = applyCanvasEdits(
    [originalFill],
    [
      { index: 0, fill: null },
      { index: 0, fill: originalFill },
    ],
  );

  expect(next).toEqual([originalFill]);
});

test("returns null when every edit already matches", () => {
  const original = [{ code: "A1", hex: "#fff8cc" }];

  expect(
    applyCanvasEdits(original, [
      { index: 0, fill: { code: "A1", hex: "#fff8cc" } },
    ]),
  ).toBeNull();
});
