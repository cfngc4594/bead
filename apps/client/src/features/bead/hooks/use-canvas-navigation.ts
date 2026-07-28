import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  getInitialScale,
  getInitialView,
  getPinchedView,
  getZoomedView,
} from "@/features/bead/lib/canvas-geometry";
import {
  getThresholdedPinchScaleFactor,
  getTwoTouchGesture,
  type TwoTouchGesture,
} from "@/features/bead/lib/touch-gesture";
import type { CanvasTool, CanvasView, Viewport } from "@/features/bead/types";

type UseCanvasNavigationProps = {
  rows: number;
  cols: number;
  viewport: Viewport;
  isViewportMeasured: boolean;
  resetViewSignal: number;
  resetViewAfterResizeSignal: number;
  tool: CanvasTool;
};

export function useCanvasNavigation({
  rows,
  cols,
  viewport,
  isViewportMeasured,
  resetViewSignal,
  resetViewAfterResizeSignal,
  tool,
}: UseCanvasNavigationProps) {
  const initializedViewKeyRef = useRef<string | null>(null);
  const handledResetSignalRef = useRef(0);
  const pendingResizeResetRef = useRef<{
    signal: number;
    viewport: Viewport;
  } | null>(null);
  const pinchGestureRef = useRef<TwoTouchGesture | null>(null);
  const pinchScaleDistanceRef = useRef<number | null>(null);
  const [view, setView] = useState<CanvasView>(() =>
    getInitialView(rows, cols, viewport),
  );
  const viewRef = useRef(view);
  const viewFrameRef = useRef<number | null>(null);
  const minScale = getInitialScale(rows, cols, viewport);

  const replaceView = useCallback((nextView: CanvasView) => {
    viewRef.current = nextView;
    setView(nextView);
  }, []);

  function updateView(
    updater: (current: CanvasView) => CanvasView,
    immediate = false,
  ) {
    viewRef.current = updater(viewRef.current);

    if (immediate) {
      if (viewFrameRef.current !== null) {
        cancelAnimationFrame(viewFrameRef.current);
        viewFrameRef.current = null;
      }

      setView(viewRef.current);
      return;
    }

    if (viewFrameRef.current !== null) {
      return;
    }

    viewFrameRef.current = requestAnimationFrame(() => {
      viewFrameRef.current = null;
      setView(viewRef.current);
    });
  }

  useLayoutEffect(() => {
    if (!isViewportMeasured) {
      return;
    }

    const viewKey = `${rows}x${cols}`;

    if (initializedViewKeyRef.current === viewKey) {
      return;
    }

    replaceView(getInitialView(rows, cols, viewport));
    initializedViewKeyRef.current = viewKey;
  }, [cols, isViewportMeasured, rows, viewport, replaceView]);

  useEffect(() => {
    if (resetViewSignal === handledResetSignalRef.current) {
      return;
    }

    handledResetSignalRef.current = resetViewSignal;

    if (resetViewSignal > 0) {
      replaceView(getInitialView(rows, cols, viewport));
      initializedViewKeyRef.current = `${rows}x${cols}`;
    }
  }, [cols, resetViewSignal, rows, viewport, replaceView]);

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
    replaceView(getInitialView(rows, cols, viewport));
    initializedViewKeyRef.current = `${rows}x${cols}`;
  }, [cols, isViewportMeasured, rows, viewport, replaceView]);

  useEffect(
    () => () => {
      if (viewFrameRef.current !== null) {
        cancelAnimationFrame(viewFrameRef.current);
      }
    },
    [],
  );

  function handleWheel(event: WheelEvent, pointer: { x: number; y: number }) {
    if (!(event.ctrlKey || event.metaKey)) {
      updateView((current) => ({
        ...current,
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      }));
      return;
    }

    updateView((current) =>
      getZoomedView({
        view: current,
        point: pointer,
        deltaY: event.deltaY,
        minScale,
      }),
    );
  }

  function handlePan(delta: { x: number; y: number }) {
    updateView((current) => ({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    }));
  }

  function handlePinchMove(
    points: [{ x: number; y: number }, { x: number; y: number }],
  ) {
    const gesture = getTwoTouchGesture(points);
    const previousGesture = pinchGestureRef.current;

    pinchGestureRef.current = gesture;

    if (!previousGesture || previousGesture.distance === 0) {
      pinchScaleDistanceRef.current = gesture.distance;
      return;
    }

    const scaleFactor = getThresholdedPinchScaleFactor({
      previousDistance:
        pinchScaleDistanceRef.current ?? previousGesture.distance,
      nextDistance: gesture.distance,
    });

    if (scaleFactor !== 1) {
      pinchScaleDistanceRef.current = gesture.distance;
    }

    updateView((current) =>
      getPinchedView({
        view: current,
        previousCenter: previousGesture.center,
        nextCenter: gesture.center,
        scaleFactor,
        minScale,
      }),
    );
  }

  function resetPinch() {
    pinchGestureRef.current = null;
    pinchScaleDistanceRef.current = null;
  }

  return {
    view,
    getView: () => viewRef.current,
    isDraggable: tool === "pan",
    handleWheel,
    handlePan,
    handlePinchMove,
    resetPinch,
  };
}
