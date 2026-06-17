"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState } from "react";

import {
  getInitialView,
  getZoomedView,
} from "@/features/perler/lib/canvas-geometry";
import type { CanvasTool, CanvasView, Viewport } from "@/features/perler/types";

type UseCanvasNavigationProps = {
  rows: number;
  cols: number;
  viewport: Viewport;
  isViewportMeasured: boolean;
  resetViewSignal: number;
  tool: CanvasTool;
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function useCanvasNavigation({
  rows,
  cols,
  viewport,
  isViewportMeasured,
  resetViewSignal,
  tool,
  stageRef,
}: UseCanvasNavigationProps) {
  const initializedViewKeyRef = useRef<string | null>(null);
  const handledResetSignalRef = useRef(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [view, setView] = useState<CanvasView>(() =>
    getInitialView(rows, cols, viewport),
  );

  useEffect(() => {
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

  return {
    view,
    isTemporaryPan: isSpacePressed,
    isDraggable: tool === "pan" || isSpacePressed,
    handleWheel,
    handleDragEnd,
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
