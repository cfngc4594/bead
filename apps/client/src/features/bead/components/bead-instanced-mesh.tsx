import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { BeadModelInstance } from "@/features/bead/lib/bead-model-layout";

const beadRadius = 0.48;
const beadHoleRadius = 0.2;
const beadHeight = 0.96;
const beadSegments = 24;

export function BeadInstancedMesh({
  instances,
}: {
  instances: readonly BeadModelInstance[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(() => createBeadGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        metalness: 0,
        roughness: 0.45,
      }),
    [],
  );
  const transform = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    for (let index = 0; index < instances.length; index += 1) {
      const instance = instances[index];

      transform.position.set(instance.x, instance.y, 0);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      mesh.setColorAt(index, color.set(instance.hex));
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    invalidate();
  }, [color, instances, invalidate, transform]);

  return (
    <instancedMesh
      args={[geometry, material, instances.length]}
      ref={meshRef}
    />
  );
}

function createBeadGeometry() {
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
