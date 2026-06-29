"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { type RefObject, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  type BeadColorGroup,
  BeadInstances,
  MeltedSheet,
} from "@/features/bead/components/bead-model-renderers";
import { useModelSceneNavigation } from "@/features/bead/hooks/use-model-scene-navigation";
import type { BeadPreviewMode } from "@/features/bead/lib/bead-model-preview-modes";
import {
  cellSize,
  getInitialScale,
  maxZoomScale,
} from "@/features/bead/lib/canvas-geometry";
import type { BeadFill } from "@/features/bead/types";

export type BeadModelSceneProps = {
  rows: number;
  cols: number;
  resetViewSignal: number;
  previewMode: BeadPreviewMode;
  beads: readonly (BeadFill | null)[];
};

const cameraFov = 32;

export function BeadModelScene({
  rows,
  cols,
  resetViewSignal,
  previewMode,
  beads,
}: BeadModelSceneProps) {
  const navigation = useModelSceneNavigation();
  const groups = useMemo(
    () => createBeadGroups({ rows, cols, beads }),
    [beads, cols, rows],
  );
  const fallbackCameraDistance = getFallbackCameraDistance({ rows, cols });

  return (
    <div
      className="h-full w-full touch-none"
      ref={navigation.containerRef}
      onPointerCancelCapture={navigation.handlePointerEndCapture}
      onPointerDownCapture={navigation.handlePointerDownCapture}
      onPointerLeave={navigation.handlePointerEndCapture}
      onPointerMoveCapture={navigation.handlePointerMoveCapture}
      onPointerUpCapture={navigation.handlePointerEndCapture}
    >
      <Canvas
        camera={{
          far: fallbackCameraDistance * 6,
          fov: cameraFov,
          near: 0.1,
          position: [0, 0, fallbackCameraDistance],
        }}
        className="h-full w-full"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.2} />
        <hemisphereLight
          color="#ffffff"
          groundColor="#d4d4d8"
          intensity={1.1}
        />
        <directionalLight intensity={2.1} position={[8, 10, 14]} />
        <directionalLight intensity={0.6} position={[-10, -6, 8]} />
        <PreviewGeometry groups={groups} previewMode={previewMode} />
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

function PreviewGeometry({
  groups,
  previewMode,
}: {
  groups: BeadColorGroup[];
  previewMode: BeadPreviewMode;
}) {
  if (previewMode === "beads") {
    return groups.map((group) => (
      <BeadInstances group={group} key={group.hex} />
    ));
  }

  return <MeltedSheet groups={groups} previewMode={previewMode} />;
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
  const fitScale = getInitialScale(rows, cols, size);
  const cameraDistance = getFitCameraDistance({
    fitScale,
    viewportHeight: size.height,
  });
  const minDistance = Math.max(0.5, (cameraDistance * fitScale) / maxZoomScale);

  return (
    <>
      <OrbitControls
        autoRotate={false}
        autoRotateSpeed={0.65}
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

function getFallbackCameraDistance({
  rows,
  cols,
}: {
  rows: number;
  cols: number;
}) {
  return Math.max(22, Math.max(rows, cols) * 1.95);
}

function getFitCameraDistance({
  fitScale,
  viewportHeight,
}: {
  fitScale: number;
  viewportHeight: number;
}) {
  const visibleWorldHeight = viewportHeight / (cellSize * fitScale);
  const fovRadians = THREE.MathUtils.degToRad(cameraFov);

  return visibleWorldHeight / (2 * Math.tan(fovRadians / 2));
}

function createBeadGroups({
  rows,
  cols,
  beads,
}: Pick<BeadModelSceneProps, "rows" | "cols" | "beads">): BeadColorGroup[] {
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
