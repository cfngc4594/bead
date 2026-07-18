import { expect, test } from "bun:test";
import {
  createBeadModelInstances,
  getModelCameraDistance,
} from "@/features/bead/lib/bead-model-layout";

test("createBeadModelInstances centers filled beads and preserves row order", () => {
  const instances = createBeadModelInstances({
    rows: 2,
    cols: 3,
    beads: [
      { code: "A1", hex: "#ABCDEF" },
      null,
      { code: "A2", hex: "#123456" },
      null,
      { code: "A3", hex: "#FEDCBA" },
      null,
    ],
  });

  expect(instances).toEqual([
    { hex: "#abcdef", x: -1, y: 0.5 },
    { hex: "#123456", x: 1, y: 0.5 },
    { hex: "#fedcba", x: 0, y: -0.5 },
  ]);
});

test("getModelCameraDistance fits the limiting model dimension", () => {
  const squareDistance = getModelCameraDistance({
    rows: 29,
    cols: 29,
    viewportWidth: 800,
    viewportHeight: 800,
    verticalFovDegrees: 32,
  });
  const wideDistance = getModelCameraDistance({
    rows: 16,
    cols: 87,
    viewportWidth: 800,
    viewportHeight: 800,
    verticalFovDegrees: 32,
  });
  const tallDistance = getModelCameraDistance({
    rows: 87,
    cols: 16,
    viewportWidth: 800,
    viewportHeight: 800,
    verticalFovDegrees: 32,
  });

  expect(wideDistance).toBeGreaterThan(squareDistance);
  expect(tallDistance).toBeCloseTo(wideDistance);
});

test("getModelCameraDistance accounts for viewport aspect ratio", () => {
  const wideViewportDistance = getModelCameraDistance({
    rows: 29,
    cols: 58,
    viewportWidth: 1000,
    viewportHeight: 500,
    verticalFovDegrees: 32,
  });
  const narrowViewportDistance = getModelCameraDistance({
    rows: 29,
    cols: 58,
    viewportWidth: 390,
    viewportHeight: 700,
    verticalFovDegrees: 32,
  });

  expect(narrowViewportDistance).toBeGreaterThan(wideViewportDistance);
});
