import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BeadModelInstance } from "@/features/bead/lib/bead-model-layout";
import { modelPreviewSpecularIntensity } from "@/features/bead/lib/model-preview-config";
import { applyPressedModelPreviewShading } from "@/features/bead/lib/model-preview-material";
import { createPressedSurfaceGeometry } from "@/features/bead/lib/pressed-model-geometry";

export type NormalTextureStatus = "loading" | "ready" | "error";

const pressedModelDepth = 0.18;

export function PressedSurfaceMesh({
  instances,
  normalMapUrl,
  normalScale,
  patternSize,
  roughness,
  textureScale,
  onTextureStatusChange,
}: {
  instances: readonly BeadModelInstance[];
  normalMapUrl: string;
  normalScale: number;
  patternSize: number;
  roughness: number;
  textureScale: number;
  onTextureStatusChange?: (status: NormalTextureStatus) => void;
}) {
  const edgeMeshRef = useRef<THREE.InstancedMesh>(null);
  const [normalMap, setNormalMap] = useState<THREE.Texture | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const surfaceGeometry = useMemo(
    () => createPressedSurfaceGeometry({ instances, patternSize }),
    [instances, patternSize],
  );
  const edgeGeometry = useMemo(
    () => new THREE.BoxGeometry(1, 1, pressedModelDepth),
    [],
  );
  const edgeMaterial = useMemo(() => {
    const nextMaterial = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      specularIntensity: modelPreviewSpecularIntensity,
    });
    nextMaterial.onBeforeCompile = applyPressedModelPreviewShading;
    return nextMaterial;
  }, []);
  const normalScaleVector = useMemo(
    () => new THREE.Vector2(normalScale, normalScale),
    [normalScale],
  );
  const transform = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    setNormalMap(null);
    onTextureStatusChange?.("loading");

    loader.load(
      normalMapUrl,
      (texture) => {
        if (!active) {
          texture.dispose();
          return;
        }

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.NoColorSpace;
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
        setNormalMap(texture);
        onTextureStatusChange?.("ready");
        invalidate();
      },
      undefined,
      (error) => {
        if (!active) {
          return;
        }

        console.error("Unable to load pressed surface normal texture", error);
        onTextureStatusChange?.("error");
        invalidate();
      },
    );

    return () => {
      active = false;
    };
  }, [invalidate, maxAnisotropy, normalMapUrl, onTextureStatusChange]);

  useLayoutEffect(() => () => surfaceGeometry.dispose(), [surfaceGeometry]);

  useLayoutEffect(
    () => () => {
      edgeGeometry.dispose();
    },
    [edgeGeometry],
  );

  useLayoutEffect(
    () => () => {
      edgeMaterial.dispose();
    },
    [edgeMaterial],
  );

  useLayoutEffect(() => {
    edgeMaterial.roughness = Math.min(1, roughness + 0.08);
    invalidate();
  }, [edgeMaterial, invalidate, roughness]);

  useLayoutEffect(() => {
    if (!normalMap) {
      return;
    }

    const repeat = 1 / textureScale;
    normalMap.repeat.set(repeat, repeat);
    invalidate();
  }, [invalidate, normalMap, textureScale]);

  useLayoutEffect(() => {
    const mesh = edgeMeshRef.current;

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

  useEffect(
    () => () => {
      normalMap?.dispose();
    },
    [normalMap],
  );

  return (
    <>
      <instancedMesh
        args={[edgeGeometry, edgeMaterial, instances.length]}
        ref={edgeMeshRef}
      />
      <mesh
        geometry={surfaceGeometry}
        position={[0, 0, pressedModelDepth / 2 + 0.002]}
      >
        <meshPhysicalMaterial
          color="#ffffff"
          key={normalMap?.uuid ?? normalMapUrl}
          metalness={0}
          normalMap={normalMap}
          normalScale={normalScaleVector}
          onBeforeCompile={applyPressedModelPreviewShading}
          roughness={roughness}
          specularIntensity={modelPreviewSpecularIntensity}
          vertexColors
        />
      </mesh>
    </>
  );
}
