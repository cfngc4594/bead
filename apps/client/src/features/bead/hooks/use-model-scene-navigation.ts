import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  getThresholdedPinchScaleFactor,
  getTwoTouchGesture,
  type TouchPoint,
  type TwoTouchGesture,
} from "@/features/bead/lib/touch-gesture";

const trackpadPanSpeed = 1;
const touchPanSpeed = 1;

export function useModelSceneNavigation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const touchPointersRef = useRef(new Map<number, TouchPoint>());
  const touchGestureRef = useRef<TwoTouchGesture | null>(null);
  const touchScaleDistanceRef = useRef<number | null>(null);
  const isCustomTouchGestureRef = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

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
        viewportHeight: container?.clientHeight ?? 0,
      });
    }

    container.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      container.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  const handlePointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      updateModelTouchPointer(touchPointersRef.current, event);
      captureTouchPointer(event);
      beginCustomTouchGestureIfNeeded({
        controls: controlsRef.current,
        event,
        isCustomTouchGestureRef,
        touchScaleDistanceRef,
        touchGestureRef,
        touchPointers: touchPointersRef.current,
      });
    },
    [],
  );
  const handlePointerMoveCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      updateModelTouchPointer(touchPointersRef.current, event);
      updateCustomTouchGesture({
        controls: controlsRef.current,
        event,
        isCustomTouchGestureRef,
        touchScaleDistanceRef,
        touchGestureRef,
        touchPointers: touchPointersRef.current,
      });
    },
    [],
  );
  const handlePointerEndCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      removeModelTouchPointer(touchPointersRef.current, event);
      resetCustomTouchGestureIfNeeded({
        controls: controlsRef.current,
        isCustomTouchGestureRef,
        touchScaleDistanceRef,
        touchGestureRef,
        touchPointers: touchPointersRef.current,
      });
    },
    [],
  );

  useLayoutEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };
  }, []);

  return {
    containerRef,
    controlsRef,
    handlePointerDownCapture,
    handlePointerEndCapture,
    handlePointerMoveCapture,
  };
}

function beginCustomTouchGestureIfNeeded({
  controls,
  event,
  isCustomTouchGestureRef,
  touchGestureRef,
  touchScaleDistanceRef,
  touchPointers,
}: {
  controls: OrbitControlsImpl | null;
  event: ReactPointerEvent<HTMLDivElement>;
  isCustomTouchGestureRef: React.RefObject<boolean>;
  touchScaleDistanceRef: React.RefObject<number | null>;
  touchGestureRef: React.RefObject<TwoTouchGesture | null>;
  touchPointers: Map<number, TouchPoint>;
}) {
  if (event.pointerType !== "touch" || touchPointers.size < 2) {
    return;
  }

  const gesture = getTrackedTouchGesture(touchPointers);

  if (!gesture) {
    return;
  }

  event.preventDefault();
  touchGestureRef.current = gesture;
  touchScaleDistanceRef.current = gesture.distance;

  if (controls && !isCustomTouchGestureRef.current) {
    isCustomTouchGestureRef.current = true;
    controls.enabled = false;
  }
}

function updateCustomTouchGesture({
  controls,
  event,
  isCustomTouchGestureRef,
  touchGestureRef,
  touchScaleDistanceRef,
  touchPointers,
}: {
  controls: OrbitControlsImpl | null;
  event: ReactPointerEvent<HTMLDivElement>;
  isCustomTouchGestureRef: React.RefObject<boolean>;
  touchScaleDistanceRef: React.RefObject<number | null>;
  touchGestureRef: React.RefObject<TwoTouchGesture | null>;
  touchPointers: Map<number, TouchPoint>;
}) {
  if (event.pointerType !== "touch" || touchPointers.size < 2) {
    return;
  }

  const gesture = getTrackedTouchGesture(touchPointers);

  if (!gesture) {
    return;
  }

  event.preventDefault();

  if (controls && !isCustomTouchGestureRef.current) {
    isCustomTouchGestureRef.current = true;
    controls.enabled = false;
  }

  const previousGesture = touchGestureRef.current;
  touchGestureRef.current = gesture;

  if (!controls || !previousGesture) {
    touchScaleDistanceRef.current = gesture.distance;
    return;
  }

  const scaleFactor = getThresholdedPinchScaleFactor({
    previousDistance: touchScaleDistanceRef.current ?? previousGesture.distance,
    nextDistance: gesture.distance,
  });

  if (scaleFactor !== 1) {
    touchScaleDistanceRef.current = gesture.distance;
  }

  panControlsByTouch({
    controls,
    deltaX: gesture.center.x - previousGesture.center.x,
    deltaY: gesture.center.y - previousGesture.center.y,
    viewportHeight: event.currentTarget.clientHeight,
  });
  zoomControlsByTouch({
    controls,
    scaleFactor,
  });
}

function resetCustomTouchGestureIfNeeded({
  controls,
  isCustomTouchGestureRef,
  touchScaleDistanceRef,
  touchGestureRef,
  touchPointers,
}: {
  controls: OrbitControlsImpl | null;
  isCustomTouchGestureRef: React.RefObject<boolean>;
  touchScaleDistanceRef: React.RefObject<number | null>;
  touchGestureRef: React.RefObject<TwoTouchGesture | null>;
  touchPointers: Map<number, TouchPoint>;
}) {
  if (touchPointers.size >= 2) {
    const gesture = getTrackedTouchGesture(touchPointers);

    touchGestureRef.current = gesture;
    touchScaleDistanceRef.current = gesture?.distance ?? null;
    return;
  }

  touchGestureRef.current = null;
  touchScaleDistanceRef.current = null;

  if (touchPointers.size === 0 && isCustomTouchGestureRef.current) {
    isCustomTouchGestureRef.current = false;

    if (controls) {
      controls.enabled = true;
    }
  }
}

function updateModelTouchPointer(
  touchPointers: Map<number, TouchPoint>,
  event: ReactPointerEvent<HTMLDivElement>,
) {
  if (event.pointerType !== "touch") {
    return;
  }

  touchPointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
  });
}

function removeModelTouchPointer(
  touchPointers: Map<number, TouchPoint>,
  event: ReactPointerEvent<HTMLDivElement>,
) {
  if (event.pointerType === "touch") {
    touchPointers.delete(event.pointerId);
  }
}

function captureTouchPointer(event: ReactPointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "touch") {
    return;
  }

  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // The browser may reject capture for an already-ended pointer.
  }
}

function getTrackedTouchGesture(touchPointers: Map<number, TouchPoint>) {
  const [first, second] = Array.from(touchPointers.values());

  if (!first || !second) {
    return null;
  }

  return getTwoTouchGesture([first, second]);
}

function panControlsByTouch({
  controls,
  deltaX,
  deltaY,
  viewportHeight,
}: {
  controls: OrbitControlsImpl;
  deltaX: number;
  deltaY: number;
  viewportHeight: number;
}) {
  if (!controls.enablePan) {
    return;
  }

  panControlsByWheel({
    controls,
    deltaX: -deltaX * touchPanSpeed,
    deltaY: -deltaY * touchPanSpeed,
    viewportHeight,
  });
}

function zoomControlsByTouch({
  controls,
  scaleFactor,
}: {
  controls: OrbitControlsImpl;
  scaleFactor: number;
}) {
  if (!controls.enableZoom || scaleFactor <= 0 || scaleFactor === 1) {
    return;
  }

  controls.dollyOut(scaleFactor ** controls.zoomSpeed);
}

function panControlsByWheel({
  controls,
  deltaX,
  deltaY,
  viewportHeight,
}: {
  controls: OrbitControlsImpl;
  deltaX: number;
  deltaY: number;
  viewportHeight: number;
}) {
  const camera = controls.object;

  if (!(camera instanceof THREE.PerspectiveCamera) || viewportHeight <= 0) {
    return;
  }

  const offset = new THREE.Vector3().subVectors(
    camera.position,
    controls.target,
  );
  const targetDistance =
    offset.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const panRightDistance =
    (2 * deltaX * targetDistance * trackpadPanSpeed) / viewportHeight;
  const panDownDistance =
    (2 * deltaY * targetDistance * trackpadPanSpeed) / viewportHeight;
  const panOffset = new THREE.Vector3();

  panOffset.add(
    new THREE.Vector3()
      .setFromMatrixColumn(camera.matrix, 0)
      .multiplyScalar(panRightDistance),
  );
  panOffset.add(
    new THREE.Vector3()
      .setFromMatrixColumn(camera.matrix, 1)
      .multiplyScalar(-panDownDistance),
  );
  camera.position.add(panOffset);
  controls.target.add(panOffset);
  controls.update();
}
