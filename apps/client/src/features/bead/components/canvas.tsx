import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useRef, useState } from "react";
import { Layer, Rect, Shape, Stage } from "react-konva";
import { useTheme } from "@/components/theme-provider";
import { useCanvasNavigation } from "@/features/bead/hooks/use-canvas-navigation";
import { useSelectionGesture } from "@/features/bead/hooks/use-selection-gesture";
import { useStageSize } from "@/features/bead/hooks/use-stage-size";
import { useTouchPinch } from "@/features/bead/hooks/use-touch-pinch";
import { resolveBoardTheme } from "@/features/bead/lib/board-theme";
import { boardInteractionPalettes } from "@/features/bead/lib/board-theme-colors";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import {
  cellSize,
  getGridCellFromPoint,
  getGridOrigin,
} from "@/features/bead/lib/canvas-geometry";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import {
  type BeadSelection,
  getSelectionBoxRect,
  getSelectionRect,
  isCellInSelection,
  isSelectionInBounds,
} from "@/features/bead/lib/selection";
import type {
  BeadFill,
  CanvasTool,
  GridCell,
  Viewport,
} from "@/features/bead/types";

export type { GridCell };

type CanvasBoardViewProps = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
  showBeadCodes: boolean;
  showGuideLines: boolean;
  resetViewSignal: number;
  resetViewAfterResizeSignal: number;
  viewport?: Viewport;
};

type EditableCanvasBoardProps = {
  mode: "editable";
  tool: CanvasTool;
  onEditStart: () => void;
  onEditCell: (cell: GridCell) => void;
  onEditEnd: () => void;
  onPickCell: (cell: GridCell) => void;
  onMoveSelection: (beads: CanvasState) => void;
  selectionResetSignal: number;
};

type ReadonlyCanvasBoardProps = {
  mode: "readonly";
};

export type CanvasBoardProps = CanvasBoardViewProps &
  (EditableCanvasBoardProps | ReadonlyCanvasBoardProps);

export function CanvasBoard(props: CanvasBoardProps) {
  const {
    rows,
    cols,
    beads,
    showBeadCodes,
    showGuideLines,
    resetViewSignal,
    resetViewAfterResizeSignal,
    viewport = { width: 760, height: 640 },
  } = props;
  const tool = props.mode === "editable" ? props.tool : "pan";
  const selectionResetSignal =
    props.mode === "editable" ? props.selectionResetSignal : 0;
  const { theme } = useTheme();
  const boardTheme = resolveBoardTheme(theme);
  const interactionPalette = boardInteractionPalettes[boardTheme];
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const { isStageMeasured, stageSize } = useStageSize({
    containerRef,
    initialViewport: viewport,
  });
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [isPainting, setIsPainting] = useState(false);
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
  const {
    handleTouchPinch,
    removeTouchPointer,
    resetPinchIfIdle,
    updateTouchPointer,
  } = useTouchPinch({
    containerRef,
    onPinchMove: handlePinchMove,
    onPinchStart: () => {
      if (isPainting && props.mode === "editable") {
        props.onEditEnd();
        setIsPainting(false);
      }
      setHoveredCell(null);
    },
    stageRef,
  });
  const {
    beginSelection,
    clearGesture,
    displayedBeads,
    finishSelection,
    isMovingSelection,
    moveTargetOrigin,
    selection,
    selectionBox,
    updateSelection,
  } = useSelectionGesture({
    beads,
    cols,
    onMoveSelection: moveSelection,
    resetSignal: selectionResetSignal,
    rows,
  });
  const gridOrigin = getGridOrigin();
  const canvasCursor = getCanvasCursor({
    hoveredCell,
    isDraggable,
    isMovingSelection,
    selection,
    tool,
  });

  function getCellFromPointer(): GridCell | null {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!stage || !pointer) {
      return null;
    }

    return getGridCellFromPoint({ point: pointer, view, rows, cols });
  }

  function editFromPointer() {
    if (props.mode !== "editable") {
      return;
    }

    const cell = getCellFromPointer();

    if (!cell) {
      return;
    }

    setHoveredCell(cell);
    props.onEditCell(cell);
  }

  function moveSelection(nextBeads: CanvasState) {
    if (props.mode === "editable") {
      props.onMoveSelection(nextBeads);
    }
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    updateTouchPointer(event.evt);

    if (handleTouchPinch()) {
      return;
    }

    if (props.mode !== "editable") {
      return;
    }

    if (tool === "picker") {
      const cell = getCellFromPointer();

      if (cell) {
        props.onPickCell(cell);
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
    props.onEditStart();
    editFromPointer();
  }

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    updateTouchPointer(event.evt);

    if (handleTouchPinch()) {
      return;
    }

    const cell = getCellFromPointer();
    setHoveredCell(cell);

    if (props.mode !== "editable") {
      return;
    }

    if (tool === "select") {
      updateSelection(cell);
      return;
    }

    if (isEditTool(tool) && isPainting && cell) {
      props.onEditCell(cell);
    }
  }

  function handlePointerUp(event?: KonvaEventObject<PointerEvent>) {
    if (event) {
      removeTouchPointer(event.evt);
    }

    resetPinchIfIdle(resetPinch);

    if (isPainting && props.mode === "editable") {
      props.onEditEnd();
    }

    if (tool === "select") {
      finishSelection();
    }

    setIsPainting(false);
  }

  function handlePointerLeave(event: KonvaEventObject<PointerEvent>) {
    removeTouchPointer(event.evt);
    resetPinch();
    setHoveredCell(null);

    if (isPainting && props.mode === "editable") {
      props.onEditEnd();
    }

    setIsPainting(false);
    clearGesture();
  }

  function handleSelectPointerDown(event: KonvaEventObject<PointerEvent>) {
    if (event.evt.button !== 0 || isTemporaryPan) {
      return;
    }

    const cell = getCellFromPointer();

    if (cell) {
      setHoveredCell(cell);
    }

    beginSelection(cell);
  }

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
                showGuideLines,
                theme: boardTheme,
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
                stroke={interactionPalette.hoverOuterStroke}
                strokeWidth={2}
                listening={false}
              />
              <Rect
                x={gridOrigin.x + hoveredCell.column * cellSize + 2.5}
                y={gridOrigin.y + hoveredCell.row * cellSize + 2.5}
                width={cellSize - 5}
                height={cellSize - 5}
                stroke={interactionPalette.hoverInnerStroke}
                strokeWidth={1}
                listening={false}
              />
            </>
          ) : null}
          {tool === "select" && selectionBox ? (
            <Rect
              {...getSelectionBoxRect(selectionBox)}
              fill={interactionPalette.selectionFill}
              stroke={interactionPalette.selectionStroke}
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
              fill={interactionPalette.activeSelectionFill}
              stroke={
                moveTargetOrigin &&
                !isSelectionInBounds(selection, moveTargetOrigin, rows, cols)
                  ? interactionPalette.invalidSelectionStroke
                  : interactionPalette.selectionStroke
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
  return tool === "paint" || tool === "mix" || tool === "erase";
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
  selection: BeadSelection | null;
  tool: CanvasTool;
}) {
  if (isDraggable) {
    return "grab";
  }

  if (tool === "paint" || tool === "mix") {
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
