import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createBeadGeometry } from "@/features/bead/lib/bead-model-geometry";
import type { BeadModelInstance } from "@/features/bead/lib/bead-model-layout";
import { modelPreviewSpecularIntensity } from "@/features/bead/lib/model-preview-config";
import { applyBeadModelPreviewShading } from "@/features/bead/lib/model-preview-material";

export function BeadInstancedMesh({
  instances,
  roughness,
}: {
  instances: readonly BeadModelInstance[];
  roughness: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(() => createBeadGeometry(), []);
  const material = useMemo(() => {
    const nextMaterial = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      specularIntensity: modelPreviewSpecularIntensity,
    });
    nextMaterial.onBeforeCompile = applyBeadModelPreviewShading;
    return nextMaterial;
  }, []);
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
    material.roughness = roughness;
    invalidate();
  }, [invalidate, material, roughness]);

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
