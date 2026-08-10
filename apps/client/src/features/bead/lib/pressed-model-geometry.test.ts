import { expect, test } from "bun:test";
import {
  createPressedShellGeometry,
  createPressedSurfaceGeometry,
} from "./pressed-model-geometry";

test("creates a pressed shell without an overlapping front face", () => {
  const geometry = createPressedShellGeometry({ depth: 0.18 });
  const normals = geometry.getAttribute("normal");

  expect(geometry.getAttribute("position").count).toBe(20);
  expect(normals.count).toBe(20);
  expect(geometry.index?.count).toBe(30);
  expect(geometry.boundingBox?.min.x).toBeCloseTo(-0.5);
  expect(geometry.boundingBox?.max.x).toBeCloseTo(0.5);
  expect(geometry.boundingBox?.min.z).toBeCloseTo(-0.09);
  expect(geometry.boundingBox?.max.z).toBeCloseTo(0.09);

  for (let index = 0; index < normals.count; index += 1) {
    expect(normals.getZ(index)).not.toBe(1);
  }

  geometry.dispose();
});

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
