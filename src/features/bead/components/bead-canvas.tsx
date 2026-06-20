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

export type BeadCanvasProps = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
  tool: CanvasTool;
  showBeadCodes: boolean;
  onEditStart: () => void;
  onEditCell: (cell: GridCell) => void;
  onEditEnd: () => void;
  onPickCell: (cell: GridCell) => void;
  onMoveSelection: (beads: (BeadFill | null)[]) => void;
  selectionResetSignal: number;
  resetViewSignal: number;
  resetViewAfterResizeSignal: number;
  viewport?: Viewport;
};

type Selection = {
  origin: GridCell;
  rows: number;
  cols: number;
  items: SelectionItem[];
};

type SelectionItem = {
  rowOffset: number;
  columnOffset: number;
  fill: BeadFill;
};

type SelectionBox = {
  start: GridCell;
  end: GridCell;
};

export function BeadCanvas({
  rows,
  cols,
  beads,
  tool,
  showBeadCodes,
  onEditStart,
  onEditCell,
  onEditEnd,
  onPickCell,
  onMoveSelection,
  selectionResetSignal,
  resetViewSignal,
  resetViewAfterResizeSignal,
  viewport = { width: 760, height: 640 },
}: BeadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const touchPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const handledSelectionResetSignalRef = useRef(selectionResetSignal);
  const [stageSize, setStageSize] = useState(viewport);
  const [isStageMeasured, setIsStageMeasured] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [moveStartCell, setMoveStartCell] = useState<GridCell | null>(null);
  const [moveTargetOrigin, setMoveTargetOrigin] = useState<GridCell | null>(
    null,
  );
  const {
    view,
    isTemporaryPan,
    isDraggable,
    handleWheel,
    handleDragEnd,
    handlePinchMove,
    resetPinch,
  } = useCanvasNavigation({
    rows,
    cols,
    viewport: stageSize,
    isViewportMeasured: isStageMeasured,
    resetViewAfterResizeSignal,
    resetViewSignal,
    tool,
    stageRef,
  });
  const gridOrigin = getGridOrigin();
  const canvasCursor = getCanvasCursor({
    hoveredCell,
    isDraggable,
    isMovingSelection: Boolean(moveStartCell),
    selection,
    tool,
  });
  const displayedBeads =
    selection && moveTargetOrigin
      ? hideSelectedBeads(beads, selection, cols)
      : beads;

  useEffect(() => {
    if (selectionResetSignal === handledSelectionResetSignalRef.current) {
      return;
    }

    handledSelectionResetSignalRef.current = selectionResetSignal;
    setSelection(null);
    setSelectionBox(null);
    setMoveStartCell(null);
    setMoveTargetOrigin(null);
  }, [selectionResetSignal]);

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
    updateTouchPointer(event.evt);

    if (handleTouchPinch()) {
      return;
    }

    if (tool === "picker") {
      const cell = getCellFromPointer();

      if (cell) {
        onPickCell(cell);
      }

      return;
    }

    if (tool === "select") {
      handleSelectPointerDown(event);
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

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    updateTouchPointer(event.evt);

    if (handleTouchPinch()) {
      return;
    }

    const cell = getCellFromPointer();
    setHoveredCell(cell);

    if (tool === "select") {
      handleSelectPointerMove(cell);
      return;
    }

    if (isEditTool(tool) && isPainting && cell) {
      onEditCell(cell);
    }
  }

  function handlePointerUp(event?: KonvaEventObject<PointerEvent>) {
    if (event) {
      removeTouchPointer(event.evt);
    }

    if (touchPointersRef.current.size < 2) {
      resetPinch();
    }

    if (isPainting) {
      onEditEnd();
    }

    if (tool === "select") {
      finishSelectionGesture();
    }

    setIsPainting(false);
  }

  function handlePointerLeave(event: KonvaEventObject<PointerEvent>) {
    removeTouchPointer(event.evt);
    resetPinch();
    setHoveredCell(null);

    if (isPainting) {
      onEditEnd();
    }

    setIsPainting(false);
    clearSelectionGestureState();
  }

  function clearSelectionGestureState() {
    setSelectionBox(null);
    setMoveStartCell(null);
    setMoveTargetOrigin(null);
  }

  function handleSelectPointerDown(event: KonvaEventObject<PointerEvent>) {
    if (event.evt.button !== 0 || isTemporaryPan) {
      return;
    }

    const cell = getCellFromPointer();

    if (!cell) {
      setSelection(null);
      return;
    }

    setHoveredCell(cell);

    if (selection && isCellInSelection(cell, selection)) {
      setMoveStartCell(cell);
      setMoveTargetOrigin(selection.origin);
      return;
    }

    setSelection(null);
    setSelectionBox({ start: cell, end: cell });
  }

  function handleSelectPointerMove(cell: GridCell | null) {
    if (!cell) {
      return;
    }

    if (selectionBox) {
      setSelectionBox((current) =>
        current ? { ...current, end: cell } : current,
      );
      return;
    }

    if (selection && moveStartCell) {
      setMoveTargetOrigin(
        getMovedSelectionOrigin(selection, moveStartCell, cell),
      );
    }
  }

  function finishSelectionGesture() {
    if (selectionBox) {
      const nextSelection = getSelectionFromBox(
        selectionBox,
        beads,
        rows,
        cols,
      );

      setSelection(nextSelection);
      setSelectionBox(null);
      return;
    }

    if (selection && moveStartCell && moveTargetOrigin) {
      if (
        isSelectionInBounds(selection, moveTargetOrigin, rows, cols) &&
        !isSameCell(selection.origin, moveTargetOrigin)
      ) {
        onMoveSelection(
          moveSelectedBeads(beads, selection, moveTargetOrigin, cols),
        );
        setSelection({
          ...selection,
          origin: moveTargetOrigin,
        });
      }

      setMoveStartCell(null);
      setMoveTargetOrigin(null);
    }
  }

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

  function handleTouchPinch() {
    const points = Array.from(touchPointersRef.current.values());

    if (points.length < 2) {
      return false;
    }

    if (isPainting) {
      onEditEnd();
      setIsPainting(false);
    }

    stageRef.current?.stopDrag();
    setHoveredCell(null);
    handlePinchMove([points[0], points[1]]);

    return true;
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
      container.removeEventListener("touchmove", preventCanvasTouchDefault);
    };
  }, []);

  return (
    <div
      className="h-full w-full touch-none overflow-hidden overscroll-none"
      ref={containerRef}
    >
      <Stage
        ref={stageRef}
        style={{
          cursor: canvasCursor,
          touchAction: "none",
        }}
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
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      >
        <Layer>
          <Shape
            listening={false}
            sceneFunc={(context, shape) => {
              drawBoard(context, rows, cols, displayedBeads, {
                showBeadCodes,
              });
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
          {tool === "select" && selectionBox ? (
            <Rect
              {...getSelectionBoxRect(selectionBox)}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="#2563eb"
              strokeWidth={1.5}
              listening={false}
            />
          ) : null}
          {tool === "select" && selection ? (
            <Rect
              {...getSelectionRect(
                selection,
                moveTargetOrigin ?? selection.origin,
              )}
              dash={[5, 4]}
              fill="rgba(59, 130, 246, 0.08)"
              stroke={
                moveTargetOrigin &&
                !isSelectionInBounds(selection, moveTargetOrigin, rows, cols)
                  ? "#dc2626"
                  : "#2563eb"
              }
              strokeWidth={1.5}
              listening={false}
            />
          ) : null}
          {tool === "select" && selection && moveTargetOrigin
            ? selection.items.map((item) => (
                <Rect
                  fill={item.fill.hex}
                  height={cellSize - 1}
                  key={`${item.rowOffset}-${item.columnOffset}`}
                  listening={false}
                  opacity={0.72}
                  width={cellSize - 1}
                  x={
                    gridOrigin.x +
                    (moveTargetOrigin.column + item.columnOffset) * cellSize +
                    1
                  }
                  y={
                    gridOrigin.y +
                    (moveTargetOrigin.row + item.rowOffset) * cellSize +
                    1
                  }
                />
              ))
            : null}
        </Layer>
      </Stage>
    </div>
  );
}

function isEditTool(tool: CanvasTool) {
  return tool === "paint" || tool === "erase";
}

function getCanvasCursor({
  hoveredCell,
  isDraggable,
  isMovingSelection,
  selection,
  tool,
}: {
  hoveredCell: GridCell | null;
  isDraggable: boolean;
  isMovingSelection: boolean;
  selection: Selection | null;
  tool: CanvasTool;
}) {
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

  if (tool === "select") {
    if (isMovingSelection) {
      return "grabbing";
    }

    if (hoveredCell && selection && isCellInSelection(hoveredCell, selection)) {
      return "grab";
    }

    return "default";
  }

  return "default";
}

function normalizeSelectionBox({ start, end }: SelectionBox) {
  const row = Math.min(start.row, end.row);
  const column = Math.min(start.column, end.column);
  const lastRow = Math.max(start.row, end.row);
  const lastColumn = Math.max(start.column, end.column);

  return {
    origin: { row, column },
    rows: lastRow - row + 1,
    cols: lastColumn - column + 1,
  };
}

function getSelectionFromBox(
  box: SelectionBox,
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
) {
  const bounds = normalizeSelectionBox(box);
  const items: SelectionItem[] = [];

  for (let rowOffset = 0; rowOffset < bounds.rows; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < bounds.cols; columnOffset += 1) {
      const row = bounds.origin.row + rowOffset;
      const column = bounds.origin.column + columnOffset;

      if (row < 0 || row >= rows || column < 0 || column >= cols) {
        continue;
      }

      const fill = beads[row * cols + column];

      if (fill) {
        items.push({ rowOffset, columnOffset, fill });
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  return {
    ...bounds,
    items,
  };
}

function getSelectionBoxRect(box: SelectionBox) {
  return getSelectionRect(normalizeSelectionBox(box));
}

function getSelectionRect(
  selection: Pick<Selection, "origin" | "rows" | "cols">,
  origin = selection.origin,
) {
  const gridOrigin = getGridOrigin();

  return {
    x: gridOrigin.x + origin.column * cellSize + 0.5,
    y: gridOrigin.y + origin.row * cellSize + 0.5,
    width: selection.cols * cellSize,
    height: selection.rows * cellSize,
  };
}

function isCellInSelection(cell: GridCell, selection: Selection) {
  return (
    cell.row >= selection.origin.row &&
    cell.row < selection.origin.row + selection.rows &&
    cell.column >= selection.origin.column &&
    cell.column < selection.origin.column + selection.cols
  );
}

function getMovedSelectionOrigin(
  selection: Selection,
  moveStartCell: GridCell,
  currentCell: GridCell,
) {
  return {
    row: selection.origin.row + currentCell.row - moveStartCell.row,
    column: selection.origin.column + currentCell.column - moveStartCell.column,
  };
}

function isSelectionInBounds(
  selection: Selection,
  origin: GridCell,
  rows: number,
  cols: number,
) {
  return (
    origin.row >= 0 &&
    origin.column >= 0 &&
    origin.row + selection.rows <= rows &&
    origin.column + selection.cols <= cols
  );
}

function moveSelectedBeads(
  beads: readonly (BeadFill | null)[],
  selection: Selection,
  targetOrigin: GridCell,
  cols: number,
) {
  const next = [...beads];

  for (const item of selection.items) {
    const sourceRow = selection.origin.row + item.rowOffset;
    const sourceColumn = selection.origin.column + item.columnOffset;

    next[sourceRow * cols + sourceColumn] = null;
  }

  for (const item of selection.items) {
    const targetRow = targetOrigin.row + item.rowOffset;
    const targetColumn = targetOrigin.column + item.columnOffset;

    next[targetRow * cols + targetColumn] = item.fill;
  }

  return next;
}

function hideSelectedBeads(
  beads: readonly (BeadFill | null)[],
  selection: Selection,
  cols: number,
) {
  const next = [...beads];

  for (const item of selection.items) {
    const sourceRow = selection.origin.row + item.rowOffset;
    const sourceColumn = selection.origin.column + item.columnOffset;

    next[sourceRow * cols + sourceColumn] = null;
  }

  return next;
}

function isSameCell(a: GridCell, b: GridCell) {
  return a.row === b.row && a.column === b.column;
}
