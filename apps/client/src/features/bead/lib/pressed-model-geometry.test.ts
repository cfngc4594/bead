import { expect, test } from "bun:test";
import { createPressedSurfaceGeometry } from "./pressed-model-geometry";

test("creates one textured quad for each filled bead", () => {
  const geometry = createPressedSurfaceGeometry({
    instances: [{ hex: "#ff0000", x: 0, y: 0 }],
    patternSize: 18,
  });

  expect(geometry.getAttribute("position").count).toBe(4);
  expect(geometry.getAttribute("normal").count).toBe(4);
  expect(geometry.getAttribute("color").count).toBe(4);
  expect(geometry.getAttribute("uv").count).toBe(4);
  expect(geometry.index?.count).toBe(6);

  geometry.dispose();
});

test("keeps normal-map coordinates continuous across adjacent beads", () => {
  const geometry = createPressedSurfaceGeometry({
    instances: [
      { hex: "#ff0000", x: 0, y: 0 },
      { hex: "#00ff00", x: 1, y: 0 },
    ],
    patternSize: 18,
  });
  const uvs = geometry.getAttribute("uv");

  expect(uvs.getX(1)).toBeCloseTo(uvs.getX(4));
  expect(uvs.getX(3)).toBeCloseTo(uvs.getX(6));
  expect(uvs.getY(1)).toBeCloseTo(uvs.getY(4));
  expect(uvs.getY(3)).toBeCloseTo(uvs.getY(6));

  geometry.dispose();
});
