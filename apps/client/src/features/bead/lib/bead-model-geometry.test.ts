import { expect, test } from "bun:test";
import { createBeadGeometry } from "./bead-model-geometry";

test("creates a closed indexed bead geometry", () => {
  const geometry = createBeadGeometry();

  expect(geometry.getAttribute("position").count).toBe(384);
  expect(geometry.getAttribute("normal").count).toBe(384);
  expect(geometry.index?.count).toBe(576);
  expect(geometry.boundingBox?.min.x).toBeCloseTo(-0.48);
  expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.48);
  expect(geometry.boundingBox?.min.z).toBeCloseTo(-0.48);
  expect(geometry.boundingBox?.max.x).toBeCloseTo(0.48);
  expect(geometry.boundingBox?.max.y).toBeCloseTo(0.48);
  expect(geometry.boundingBox?.max.z).toBeCloseTo(0.48);

  geometry.dispose();
});
