import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const trackpadPanSpeed = 1;

type PanScratch = {
  cameraOffset: THREE.Vector3;
  panOffset: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
};

export function useModelSceneNavigation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const panScratchRef = useRef<PanScratch>({
    cameraOffset: new THREE.Vector3(),
    panOffset: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
  });

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const navigationElement = container;

    function handleWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) {
        return;
      }

      const controls = controlsRef.current;

      if (!controls) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      panControlsByWheel({
        controls,
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        scratch: panScratchRef.current,
        viewportHeight: navigationElement.clientHeight,
      });
    }

    navigationElement.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      navigationElement.removeEventListener("wheel", handleWheel, {
        capture: true,
      });
    };
  }, []);

  return {
    containerRef,
    controlsRef,
  };
}

function panControlsByWheel({
  controls,
  deltaX,
  deltaY,
  scratch,
  viewportHeight,
}: {
  controls: OrbitControlsImpl;
  deltaX: number;
  deltaY: number;
  scratch: PanScratch;
  viewportHeight: number;
}) {
  const camera = controls.object;

  if (!(camera instanceof THREE.PerspectiveCamera) || viewportHeight <= 0) {
    return;
  }

  const targetDistance =
    scratch.cameraOffset.subVectors(camera.position, controls.target).length() *
    Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const panRightDistance =
    (2 * deltaX * targetDistance * trackpadPanSpeed) / viewportHeight;
  const panDownDistance =
    (2 * deltaY * targetDistance * trackpadPanSpeed) / viewportHeight;

  scratch.right.setFromMatrixColumn(camera.matrix, 0);
  scratch.up.setFromMatrixColumn(camera.matrix, 1);
  scratch.panOffset
    .copy(scratch.right)
    .multiplyScalar(panRightDistance)
    .addScaledVector(scratch.up, -panDownDistance);
  camera.position.add(scratch.panOffset);
  controls.target.add(scratch.panOffset);
  controls.update();
}
