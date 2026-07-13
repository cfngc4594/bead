import * as THREE from "three";

const beadRadius = 0.48;
const beadHoleRadius = 0.2;
const beadHeight = 0.96;
const beadSegments = 24;

export function createBeadGeometry() {
  const halfHeight = beadHeight / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  function addQuad(
    first: readonly number[],
    second: readonly number[],
    third: readonly number[],
    fourth: readonly number[],
  ) {
    const baseIndex = positions.length / 3;

    for (const vertex of [first, second, third, fourth]) {
      positions.push(vertex[0], vertex[1], vertex[2]);
      normals.push(vertex[3], vertex[4], vertex[5]);
    }

    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 3,
    );
  }

  for (let segment = 0; segment < beadSegments; segment += 1) {
    const angle = (segment / beadSegments) * Math.PI * 2;
    const nextAngle = ((segment + 1) / beadSegments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nextCos = Math.cos(nextAngle);
    const nextSin = Math.sin(nextAngle);

    addQuad(
      [cos * beadRadius, sin * beadRadius, halfHeight, cos, sin, 0],
      [cos * beadRadius, sin * beadRadius, -halfHeight, cos, sin, 0],
      [
        nextCos * beadRadius,
        nextSin * beadRadius,
        halfHeight,
        nextCos,
        nextSin,
        0,
      ],
      [
        nextCos * beadRadius,
        nextSin * beadRadius,
        -halfHeight,
        nextCos,
        nextSin,
        0,
      ],
    );

    addQuad(
      [
        nextCos * beadHoleRadius,
        nextSin * beadHoleRadius,
        halfHeight,
        -nextCos,
        -nextSin,
        0,
      ],
      [
        nextCos * beadHoleRadius,
        nextSin * beadHoleRadius,
        -halfHeight,
        -nextCos,
        -nextSin,
        0,
      ],
      [cos * beadHoleRadius, sin * beadHoleRadius, halfHeight, -cos, -sin, 0],
      [cos * beadHoleRadius, sin * beadHoleRadius, -halfHeight, -cos, -sin, 0],
    );

    addQuad(
      [cos * beadRadius, sin * beadRadius, halfHeight, 0, 0, 1],
      [nextCos * beadRadius, nextSin * beadRadius, halfHeight, 0, 0, 1],
      [cos * beadHoleRadius, sin * beadHoleRadius, halfHeight, 0, 0, 1],
      [nextCos * beadHoleRadius, nextSin * beadHoleRadius, halfHeight, 0, 0, 1],
    );

    addQuad(
      [cos * beadRadius, sin * beadRadius, -halfHeight, 0, 0, -1],
      [cos * beadHoleRadius, sin * beadHoleRadius, -halfHeight, 0, 0, -1],
      [nextCos * beadRadius, nextSin * beadRadius, -halfHeight, 0, 0, -1],
      [
        nextCos * beadHoleRadius,
        nextSin * beadHoleRadius,
        -halfHeight,
        0,
        0,
        -1,
      ],
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
