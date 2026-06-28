"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  getInitialScale,
  getInitialView,
  getPinchedView,
  getZoomedView,
} from "@/features/bead/lib/canvas-geometry";
import type { CanvasTool, CanvasView, Viewport } from "@/features/bead/types";

type UseCanvasNavigationProps = {
  rows: number;
  cols: number;
  viewport: Viewport;
  isViewportMeasured: boolean;
  resetViewSignal: number;
  resetViewAfterResizeSignal: number;
  tool: CanvasTool;
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function useCanvasNavigation({
  rows,
  cols,
  viewport,
  isViewportMeasured,
  resetViewSignal,
  resetViewAfterResizeSignal,
  tool,
  stageRef,
}: UseCanvasNavigationProps) {
  const initializedViewKeyRef = useRef<string | null>(null);
  const handledResetSignalRef = useRef(0);
  const pendingResizeResetRef = useRef<{
    signal: number;
    viewport: Viewport;
  } | null>(null);
  const pinchGestureRef = useRef<{
    center: { x: number; y: number };
    distance: number;
  } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [view, setView] = useState<CanvasView>(() =>
    getInitialView(rows, cols, viewport),
  );
  const minScale = getInitialScale(rows, cols, viewport);

  useLayoutEffect(() => {
    if (!isViewportMeasured) {
      return;
    }

    const viewKey = `${rows}x${cols}`;

    if (initializedViewKeyRef.current === viewKey) {
      return;
    }

    setView(getInitialView(rows, cols, viewport));
    initializedViewKeyRef.current = viewKey;
  }, [cols, isViewportMeasured, rows, viewport]);

  useEffect(() => {
    if (resetViewSignal === handledResetSignalRef.current) {
      return;
    }

    handledResetSignalRef.current = resetViewSignal;

    if (resetViewSignal > 0) {
      setView(getInitialView(rows, cols, viewport));
      initializedViewKeyRef.current = `${rows}x${cols}`;
    }
  }, [cols, resetViewSignal, rows, viewport]);

  useEffect(() => {
    if (
      resetViewAfterResizeSignal === 0 ||
      resetViewAfterResizeSignal === pendingResizeResetRef.current?.signal
    ) {
      return;
    }

    pendingResizeResetRef.current = {
      signal: resetViewAfterResizeSignal,
      viewport,
    };
  }, [resetViewAfterResizeSignal, viewport]);

  useLayoutEffect(() => {
    const pendingReset = pendingResizeResetRef.current;

    if (!isViewportMeasured || !pendingReset) {
      return;
    }

    if (
      pendingReset.viewport.width === viewport.width &&
      pendingReset.viewport.height === viewport.height
    ) {
      return;
    }

    pendingResizeResetRef.current = null;
    setView(getInitialView(rows, cols, viewport));
    initializedViewKeyRef.current = `${rows}x${cols}`;
  }, [cols, isViewportMeasured, rows, viewport]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setIsSpacePressed(true);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();

    const pointer = stageRef.current?.getPointerPosition();

    if (!pointer) {
      return;
    }

    if (!(event.evt.ctrlKey || event.evt.metaKey)) {
      setView((current) => ({
        ...current,
        x: current.x - event.evt.deltaX,
        y: current.y - event.evt.deltaY,
      }));
      return;
    }

    setView((current) =>
      getZoomedView({
        view: current,
        point: pointer,
        deltaY: event.evt.deltaY,
        minScale,
      }),
    );
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    setView((current) => ({
      ...current,
      x: event.target.x(),
      y: event.target.y(),
    }));
  }

  function handlePinchMove(
    points: [{ x: number; y: number }, { x: number; y: number }],
  ) {
    const gesture = getPinchGesture(points);
    const previousGesture = pinchGestureRef.current;

    pinchGestureRef.current = gesture;

    if (!previousGesture || previousGesture.distance === 0) {
      return;
    }

    setView((current) =>
      getPinchedView({
        view: current,
        previousCenter: previousGesture.center,
        nextCenter: gesture.center,
        scaleFactor: gesture.distance / previousGesture.distance,
        minScale,
      }),
    );
  }

  function resetPinch() {
    pinchGestureRef.current = null;
  }

  return {
    view,
    isTemporaryPan: isSpacePressed,
    isDraggable: tool === "pan" || isSpacePressed,
    handleWheel,
    handleDragEnd,
    handlePinchMove,
    resetPinch,
  };
}

function getPinchGesture([first, second]: [
  { x: number; y: number },
  { x: number; y: number },
]) {
  return {
    center: {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    },
    distance: Math.hypot(first.x - second.x, first.y - second.y),
  };
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.matches("input, textarea, select, [role='textbox']")
  );
}
