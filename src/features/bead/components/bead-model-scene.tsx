"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { BeadFill } from "@/features/bead/types";

export type BeadModelSceneProps = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
};

type BeadColorGroup = {
  hex: string;
  positions: number[];
};

const beadRadius = 0.48;
const beadHeight = 0.14;
const beadSegments = 36;

export function BeadModelScene({ rows, cols, beads }: BeadModelSceneProps) {
  const groups = useMemo(
    () => createBeadGroups({ rows, cols, beads }),
    [beads, cols, rows],
  );
  const cameraDistance = Math.max(22, Math.max(rows, cols) * 1.95);

  return (
    <Canvas
      camera={{
        far: cameraDistance * 6,
        fov: 32,
        near: 0.1,
        position: [0, 0, cameraDistance],
      }}
      className="h-full w-full"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.2} />
      <hemisphereLight color="#ffffff" groundColor="#d4d4d8" intensity={1.1} />
      <directionalLight intensity={2.1} position={[8, 10, 14]} />
      <directionalLight intensity={0.6} position={[-10, -6, 8]} />
      {groups.map((group) => (
        <BeadInstances group={group} key={group.hex} />
      ))}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.65}
        dampingFactor={0.08}
        enableDamping
        makeDefault
        maxDistance={cameraDistance * 2.4}
        maxPolarAngle={Math.PI / 2 + 0.45}
        minDistance={cameraDistance * 0.3}
        minPolarAngle={Math.PI / 2 - 0.45}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

function BeadInstances({ group }: { group: BeadColorGroup }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const instanceCount = group.positions.length / 3;
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.CylinderGeometry(
      beadRadius,
      beadRadius,
      beadHeight,
      beadSegments,
      1,
      false,
    );

    nextGeometry.rotateX(Math.PI / 2);

    return nextGeometry;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    for (let index = 0; index < instanceCount; index += 1) {
      const positionIndex = index * 3;

      transform.position.set(
        group.positions[positionIndex],
        group.positions[positionIndex + 1],
        group.positions[positionIndex + 2],
      );
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [group.positions, instanceCount, transform]);

  return (
    <instancedMesh
      args={[undefined, undefined, instanceCount]}
      frustumCulled={false}
      ref={meshRef}
    >
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={group.hex}
        metalness={0.02}
        roughness={0.45}
      />
    </instancedMesh>
  );
}

function createBeadGroups({
  rows,
  cols,
  beads,
}: BeadModelSceneProps): BeadColorGroup[] {
  const groups = new Map<string, BeadColorGroup>();
  const xOffset = (cols - 1) / 2;
  const yOffset = (rows - 1) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const bead = beads[row * cols + col];

      if (!bead) {
        continue;
      }

      const hex = bead.hex.toLowerCase();
      const group = groups.get(hex) ?? { hex, positions: [] };
      group.positions.push(col - xOffset, yOffset - row, 0);
      groups.set(hex, group);
    }
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.hex.localeCompare(right.hex),
  );
}
