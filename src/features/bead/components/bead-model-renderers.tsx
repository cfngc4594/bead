"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  type MeltedBeadPreviewMode,
  type MeltProfile,
  meltProfiles,
} from "@/features/bead/lib/bead-model-preview-modes";
import {
  createSurfaceTexture,
  getSurfaceBumpScale,
} from "@/features/bead/lib/bead-model-surface-textures";

export type BeadColorGroup = {
  hex: string;
  positions: number[];
};

const beadRadius = 0.48;
const beadHoleRadius = 0.2;
const beadHeight = 0.96;
const beadSegments = 36;

export function BeadInstances({ group }: { group: BeadColorGroup }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const instanceCount = group.positions.length / 3;
  const geometry = useMemo(() => createUnmeltedBeadGeometry(), []);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    writeGroupMatrices({
      mesh,
      positions: group.positions,
      transform,
    });
  }, [group.positions, transform]);

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

function createUnmeltedBeadGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, beadRadius, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, beadHoleRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: beadSegments,
    depth: beadHeight,
    steps: 1,
  });

  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}

export function MeltedSheet({
  groups,
  previewMode,
}: {
  groups: BeadColorGroup[];
  previewMode: MeltedBeadPreviewMode;
}) {
  const profile = meltProfiles[previewMode];
  const geometry = useMemo(() => createMeltedTileGeometry(profile), [profile]);
  const bumpMap = useMemo(
    () => createSurfaceTexture(profile.texture),
    [profile.texture],
  );

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => () => bumpMap.dispose(), [bumpMap]);

  return groups.map((group) => (
    <MeltedTileInstances
      bumpMap={bumpMap}
      geometry={geometry}
      group={group}
      key={`${previewMode}-${group.hex}`}
      profile={profile}
    />
  ));
}

function MeltedTileInstances({
  bumpMap,
  geometry,
  group,
  profile,
}: {
  bumpMap: THREE.Texture;
  geometry: THREE.BufferGeometry;
  group: BeadColorGroup;
  profile: MeltProfile;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const instanceCount = group.positions.length / 3;

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    writeGroupMatrices({
      mesh,
      positions: group.positions,
      transform,
    });
  }, [group.positions, transform]);

  return (
    <instancedMesh
      args={[undefined, undefined, instanceCount]}
      frustumCulled={false}
      ref={meshRef}
    >
      <primitive attach="geometry" object={geometry} />
      <meshPhysicalMaterial
        bumpMap={bumpMap}
        bumpScale={getSurfaceBumpScale(profile.texture)}
        clearcoat={profile.clearcoat}
        clearcoatRoughness={profile.clearcoatRoughness}
        color={group.hex}
        map={bumpMap}
        metalness={profile.metalness}
        roughness={profile.roughness}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function writeGroupMatrices({
  mesh,
  positions,
  transform,
}: {
  mesh: THREE.InstancedMesh;
  positions: number[];
  transform: THREE.Object3D;
}) {
  const instanceCount = positions.length / 3;

  for (let index = 0; index < instanceCount; index += 1) {
    const positionIndex = index * 3;

    transform.position.set(
      positions[positionIndex],
      positions[positionIndex + 1],
      positions[positionIndex + 2],
    );
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

function createMeltedTileGeometry(profile: MeltProfile) {
  const half = profile.tileSize / 2;
  const shape = new THREE.Shape();
  const radius = Math.min(profile.cornerRadius, half - 0.02);

  if (radius <= 0) {
    shape.moveTo(-half, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.lineTo(-half, -half);
  } else {
    shape.moveTo(-half + radius, -half);
    shape.lineTo(half - radius, -half);
    shape.quadraticCurveTo(half, -half, half, -half + radius);
    shape.lineTo(half, half - radius);
    shape.quadraticCurveTo(half, half, half - radius, half);
    shape.lineTo(-half + radius, half);
    shape.quadraticCurveTo(-half, half, -half, half - radius);
    shape.lineTo(-half, -half + radius);
    shape.quadraticCurveTo(-half, -half, -half + radius, -half);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: profile.bevelSize > 0,
    bevelSegments: 2,
    bevelSize: profile.bevelSize,
    bevelThickness: profile.bevelSize,
    curveSegments: 8,
    depth: profile.height,
    steps: 1,
  });

  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}
