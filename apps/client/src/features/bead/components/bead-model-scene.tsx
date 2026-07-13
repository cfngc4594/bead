import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type RefObject, useLayoutEffect, useMemo } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BeadInstancedMesh } from "@/features/bead/components/bead-instanced-mesh";
import {
  type NormalTextureStatus,
  PressedSurfaceMesh,
} from "@/features/bead/components/pressed-surface-mesh";
import { useModelSceneNavigation } from "@/features/bead/hooks/use-model-scene-navigation";
import {
  createBeadModelInstances,
  getModelCameraDistance,
} from "@/features/bead/lib/bead-model-layout";
import {
  getPressedModelPreviewConfig,
  type ModelPreviewMode,
  type ModelPreviewSettings,
} from "@/features/bead/lib/model-preview-config";
import type { BeadFill } from "@/features/bead/types";

export type BeadModelSceneProps = {
  rows: number;
  cols: number;
  resetViewSignal: number;
  beads: readonly (BeadFill | null)[];
  mode: ModelPreviewMode;
  settings: ModelPreviewSettings;
  onTextureStatusChange?: (status: NormalTextureStatus) => void;
};

const cameraFov = 32;
const maxZoomFactor = 8;

export function BeadModelScene({
  rows,
  cols,
  resetViewSignal,
  beads,
  mode,
  settings,
  onTextureStatusChange,
}: BeadModelSceneProps) {
  const navigation = useModelSceneNavigation();
  const instances = useMemo(
    () => createBeadModelInstances({ rows, cols, beads }),
    [beads, cols, rows],
  );
  const fallbackCameraDistance = getModelCameraDistance({
    rows,
    cols,
    viewportHeight: 1,
    viewportWidth: 1,
    verticalFovDegrees: cameraFov,
  });
  const pressedConfig =
    mode === "beads" ? null : getPressedModelPreviewConfig(mode);

  return (
    <div className="h-full w-full touch-none" ref={navigation.containerRef}>
      <Canvas
        camera={{
          far: fallbackCameraDistance * 6,
          fov: cameraFov,
          near: 0.1,
          position: [0, 0, fallbackCameraDistance],
        }}
        className="h-full w-full"
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
      >
        <hemisphereLight
          color="#ffffff"
          groundColor="#d4d4d8"
          intensity={0.8 * settings.lightIntensity}
        />
        <directionalLight
          intensity={1.6 * settings.lightIntensity}
          position={[8, 10, 14]}
        />
        <directionalLight
          intensity={0.35 * settings.lightIntensity}
          position={[-10, -6, 8]}
        />
        {pressedConfig ? (
          <PressedSurfaceMesh
            instances={instances}
            normalMapUrl={pressedConfig.normalMapUrl}
            normalScale={pressedConfig.normalScale * settings.textureStrength}
            onTextureStatusChange={onTextureStatusChange}
            patternSize={pressedConfig.patternSize}
            roughness={settings.roughness}
            textureScale={settings.textureScale}
          />
        ) : (
          <BeadInstancedMesh
            instances={instances}
            roughness={settings.roughness}
          />
        )}
        <ModelCameraControls
          cols={cols}
          controlsRef={navigation.controlsRef}
          key={resetViewSignal}
          rows={rows}
        />
      </Canvas>
    </div>
  );
}

function ModelCameraControls({
  cols,
  controlsRef,
  rows,
}: {
  cols: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  rows: number;
}) {
  const { size } = useThree();
  const cameraDistance = getModelCameraDistance({
    rows,
    cols,
    viewportHeight: size.height,
    viewportWidth: size.width,
    verticalFovDegrees: cameraFov,
  });
  const minDistance = Math.max(1, cameraDistance / maxZoomFactor);

  return (
    <>
      <OrbitControls
        autoRotate={false}
        dampingFactor={0.08}
        enableDamping
        makeDefault
        maxDistance={cameraDistance}
        maxPolarAngle={Math.PI / 2 + 0.45}
        minDistance={minDistance}
        minPolarAngle={Math.PI / 2 - 0.45}
        ref={controlsRef}
        screenSpacePanning
        target={[0, 0, 0]}
      />
      <ResetModelView
        cameraDistance={cameraDistance}
        controlsRef={controlsRef}
      />
    </>
  );
}

function ResetModelView({
  cameraDistance,
  controlsRef,
}: {
  cameraDistance: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  useLayoutEffect(() => {
    const controls = controlsRef.current;

    if (!controls) {
      return;
    }

    controls.object.position.set(0, 0, cameraDistance);
    controls.target.set(0, 0, 0);
    controls.update();
  }, [cameraDistance, controlsRef]);

  return null;
}
