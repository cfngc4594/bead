"use client";

import type Konva from "konva";
import { useEffect, useRef } from "react";

type TouchPoint = { x: number; y: number };

export function useTouchPinch({
  containerRef,
  onPinchMove,
  onPinchStart,
  stageRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPinchMove: (points: [TouchPoint, TouchPoint]) => void;
  onPinchStart: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}) {
  const touchPointersRef = useRef(new Map<number, TouchPoint>());
  const isPinchingRef = useRef(false);

  function updateTouchPointer(event: PointerEvent) {
    if (event.pointerType !== "touch") {
      return;
    }

    const point = getRelativeTouchPoint(event);

    if (point) {
      touchPointersRef.current.set(event.pointerId, point);
    }
  }

  function removeTouchPointer(event: PointerEvent) {
    if (event.pointerType === "touch") {
      touchPointersRef.current.delete(event.pointerId);
    }
  }

  function resetPinchIfIdle(resetPinch: () => void) {
    if (touchPointersRef.current.size < 2) {
      isPinchingRef.current = false;
      resetPinch();
    }
  }

  function handleTouchPinch() {
    const points = Array.from(touchPointersRef.current.values());

    if (points.length < 2) {
      return false;
    }

    if (!isPinchingRef.current) {
      isPinchingRef.current = true;
      onPinchStart();
    }

    stageRef.current?.stopDrag();
    onPinchMove([points[0], points[1]]);

    return true;
  }

  function getRelativeTouchPoint(event: PointerEvent) {
    const container = containerRef.current;

    if (!container) {
      return null;
    }

    const rect = container.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    function preventCanvasTouchDefault(event: TouchEvent) {
      event.preventDefault();
    }

    container.addEventListener("touchmove", preventCanvasTouchDefault, {
      passive: false,
    });

    return () => {
      touchPointersRef.current.clear();
      isPinchingRef.current = false;
      container.removeEventListener("touchmove", preventCanvasTouchDefault);
    };
  }, [containerRef]);

  return {
    handleTouchPinch,
    removeTouchPointer,
    resetPinchIfIdle,
    updateTouchPointer,
  };
}
