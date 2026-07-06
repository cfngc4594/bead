import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  type MeltedBeadPreviewMode,
  type MeltProfile,
  meltProfiles,
} from "@/features/bead/lib/bead-model-preview-modes";
import {
  createSurfaceTexture,
  createTowelCleanColorTexture,
  createTowelFiberHighlightTexture,
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
  geometry.computeBoundingSphere();

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
  const fiberHighlightMap = useMemo(
    () =>
      profile.texture === "towel" ? createTowelFiberHighlightTexture() : null,
    [profile.texture],
  );
  const cleanColorMap = useMemo(
    () => (profile.texture === "towel" ? createTowelCleanColorTexture() : null),
    [profile.texture],
  );

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => () => bumpMap.dispose(), [bumpMap]);
  useLayoutEffect(
    () => () => fiberHighlightMap?.dispose(),
    [fiberHighlightMap],
  );
  useLayoutEffect(() => () => cleanColorMap?.dispose(), [cleanColorMap]);

  return groups.map((group) => (
    <MeltedTileInstances
      bumpMap={bumpMap}
      cleanColorMap={cleanColorMap}
      fiberHighlightMap={fiberHighlightMap}
      geometry={geometry}
      group={group}
      key={`${previewMode}-${group.hex}`}
      profile={profile}
    />
  ));
}

function MeltedTileInstances({
  bumpMap,
  cleanColorMap,
  fiberHighlightMap,
  geometry,
  group,
  profile,
}: {
  bumpMap: THREE.Texture;
  cleanColorMap: THREE.Texture | null;
  fiberHighlightMap: THREE.Texture | null;
  geometry: THREE.BufferGeometry;
  group: BeadColorGroup;
  profile: MeltProfile;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const instanceCount = group.positions.length / 3;
  const towelFiberGlow =
    profile.texture === "towel" ? getTowelFiberGlow(group.hex) : 0;
  const colorMap = profile.texture === "towel" ? cleanColorMap : bumpMap;

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
        emissive="#ffffff"
        emissiveIntensity={towelFiberGlow}
        emissiveMap={fiberHighlightMap}
        map={colorMap}
        metalness={profile.metalness}
        roughness={profile.roughness}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function getTowelFiberGlow(hex: string) {
  const color = new THREE.Color(hex);
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;

  if (luminance < 0.08) {
    return 0.12;
  }

  if (luminance < 0.45) {
    return 0.065;
  }

  return 0.035;
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
