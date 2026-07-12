import * as THREE from "three";
import type { BeadModelInstance } from "@/features/bead/lib/bead-model-layout";

export function createPressedSurfaceGeometry({
  instances,
  patternSize,
}: {
  instances: readonly BeadModelInstance[];
  patternSize: number;
}) {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color();

  for (const instance of instances) {
    const vertexOffset = positions.length / 3;
    const left = instance.x - 0.5;
    const right = instance.x + 0.5;
    const bottom = instance.y - 0.5;
    const top = instance.y + 0.5;

    positions.push(
      left,
      bottom,
      0,
      right,
      bottom,
      0,
      left,
      top,
      0,
      right,
      top,
      0,
    );
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);

    color.set(instance.hex);
    for (let vertex = 0; vertex < 4; vertex += 1) {
      colors.push(color.r, color.g, color.b);
    }

    uvs.push(
      left / patternSize,
      bottom / patternSize,
      right / patternSize,
      bottom / patternSize,
      left / patternSize,
      top / patternSize,
      right / patternSize,
      top / patternSize,
    );
    indices.push(
      vertexOffset,
      vertexOffset + 1,
      vertexOffset + 2,
      vertexOffset + 2,
      vertexOffset + 1,
      vertexOffset + 3,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
