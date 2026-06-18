"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Shape, Stage } from "react-konva";
import { useCanvasNavigation } from "@/features/bead/hooks/use-canvas-navigation";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import {
  cellSize,
  getGridCellFromPoint,
  getGridOrigin,
} from "@/features/bead/lib/canvas-geometry";
import type {
  BeadFill,
  CanvasTool,
  GridCell,
  Viewport,
} from "@/features/bead/types";

export type { GridCell };

type BeadCanvasProps = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
  tool: CanvasTool;
  onEditStart: () => void;
  onEditCell: (cell: GridCell) => void;
  onEditEnd: () => void;
  onPickCell: (cell: GridCell) => void;
  resetViewSignal: number;
  viewport?: Viewport;
};

export function BeadCanvas({
  rows,
  cols,
  beads,
  tool,
  onEditStart,
  onEditCell,
  onEditEnd,
  onPickCell,
  resetViewSignal,
  viewport = { width: 760, height: 640 },
}: BeadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState(viewport);
  const [isStageMeasured, setIsStageMeasured] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const { view, isTemporaryPan, isDraggable, handleWheel, handleDragEnd } =
    useCanvasNavigation({
      rows,
      cols,
      viewport: stageSize,
      isViewportMeasured: isStageMeasured,
      resetViewSignal,
      tool,
      stageRef,
    });
  const gridOrigin = getGridOrigin();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      setStageSize({
        width: Math.max(1, width),
        height: Math.max(1, height),
      });
      setIsStageMeasured(true);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  function getCellFromPointer(): GridCell | null {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!stage || !pointer) {
      return null;
    }

    return getGridCellFromPoint({ point: pointer, view, rows, cols });
  }

  function editFromPointer() {
    const cell = getCellFromPointer();

    if (!cell) {
      return;
    }

    setHoveredCell(cell);
    onEditCell(cell);
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    if (tool === "picker") {
      const cell = getCellFromPointer();

      if (cell) {
        onPickCell(cell);
      }

      return;
    }

    if (!isEditTool(tool) || isTemporaryPan) {
      return;
    }

    if (event.evt.button !== 0) {
      return;
    }

    setIsPainting(true);
    onEditStart();
    editFromPointer();
  }

  function handlePointerMove() {
    const cell = getCellFromPointer();
    setHoveredCell(cell);

    if (isEditTool(tool) && isPainting && cell) {
      onEditCell(cell);
    }
  }

  function handlePointerUp() {
    if (isPainting) {
      onEditEnd();
    }

    setIsPainting(false);
  }

  function handlePointerLeave() {
    setHoveredCell(null);

    if (isPainting) {
      onEditEnd();
    }

    setIsPainting(false);
  }

  return (
    <div className="h-full w-full overflow-hidden" ref={containerRef}>
      <Stage
        ref={stageRef}
        style={{ cursor: getCanvasCursor(tool, isDraggable) }}
        width={stageSize.width}
        height={stageSize.height}
        x={view.x}
        y={view.y}
        scaleX={view.scale}
        scaleY={view.scale}
        draggable={isDraggable}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      >
        <Layer>
          <Shape
            listening={false}
            sceneFunc={(context, shape) => {
              drawBoard(context, rows, cols, beads);
              context.fillStrokeShape(shape);
            }}
          />
          {hoveredCell ? (
            <>
              <Rect
                x={gridOrigin.x + hoveredCell.column * cellSize + 1}
                y={gridOrigin.y + hoveredCell.row * cellSize + 1}
                width={cellSize - 2}
                height={cellSize - 2}
                stroke="#ffffff"
                strokeWidth={2}
                listening={false}
              />
              <Rect
                x={gridOrigin.x + hoveredCell.column * cellSize + 2.5}
                y={gridOrigin.y + hoveredCell.row * cellSize + 2.5}
                width={cellSize - 5}
                height={cellSize - 5}
                stroke="#111111"
                strokeWidth={1}
                listening={false}
              />
            </>
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}

function isEditTool(tool: CanvasTool) {
  return tool === "paint" || tool === "erase";
}

function getCanvasCursor(tool: CanvasTool, isDraggable: boolean) {
  if (isDraggable) {
    return "grab";
  }

  if (tool === "paint") {
    return "crosshair";
  }

  if (tool === "erase") {
    return "cell";
  }

  if (tool === "picker") {
    return "copy";
  }

  return "default";
}
