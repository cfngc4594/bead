import type Konva from "konva";
import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Shape,
  Stage,
} from "react-konva";
import { useTheme } from "@/components/theme-provider";
import { useCanvasNavigation } from "@/features/bead/hooks/use-canvas-navigation";
import { useSelectionGesture } from "@/features/bead/hooks/use-selection-gesture";
import { useStageSize } from "@/features/bead/hooks/use-stage-size";
import { useTouchPinch } from "@/features/bead/hooks/use-touch-pinch";
import { useBeadCodeRendering } from "@/features/bead/lib/bead-code-visibility";
import { resolveBoardTheme } from "@/features/bead/lib/board-theme";
import {
  boardDrawingPalettes,
  boardInteractionPalettes,
} from "@/features/bead/lib/board-theme-colors";
import {
  cellSize,
  getGridCellFromPoint,
  getGridOrigin,
} from "@/features/bead/lib/canvas-geometry";
import {
  createColumnLabelTexture,
  createRowLabelTexture,
  drawBeadTexture,
  drawGridLines,
  drawVisibleBeadCodes,
  syncBeadTexture,
} from "@/features/bead/lib/canvas-interactive-rendering";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import { getGridLineCells } from "@/features/bead/lib/canvas-stroke";
import {
  type BeadSelection,
  getSelectionBoxRect,
  getSelectionRect,
  isCellInSelection,
  isSameCell,
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
  resetViewSignal: number;
  resetViewAfterResizeSignal: number;
  viewport?: Viewport;
};

type EditableCanvasBoardProps = {
  mode: "editable";
  tool: CanvasTool;
  onEditStart: () => void;
  onEditCells: (cells: readonly GridCell[]) => void;
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
    resetViewSignal,
    resetViewAfterResizeSignal,
    viewport = { width: 760, height: 640 },
  } = props;
  const tool = props.mode === "editable" ? props.tool : "pan";
  const selectionResetSignal =
    props.mode === "editable" ? props.selectionResetSignal : 0;
  const { theme } = useTheme();
  const boardTheme = resolveBoardTheme(theme);
  const drawingPalette = boardDrawingPalettes[boardTheme];
  const interactionPalette = boardInteractionPalettes[boardTheme];
  const containerRef = useRef<HTMLDivElement>(null);
  const boardLayerRef = useRef<Konva.Layer>(null);
  const pendingEditFrameRef = useRef<number | null>(null);
  const pendingEditCellsRef = useRef<GridCell[]>([]);
  const pendingEditKeysRef = useRef(new Set<number>());
  const lastPaintCellRef = useRef<GridCell | null>(null);
  const isPaintingRef = useRef(false);
  const panPointerRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const navigationEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const previousTextureBeadsRef = useRef<readonly (BeadFill | null)[] | null>(
    null,
  );
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { isStageMeasured, stageSize } = useStageSize({
    containerRef,
    initialViewport: viewport,
  });
  const {
    view,
    getView,
    isTemporaryPan,
    isDraggable,
    handleWheel: navigateWithWheel,
    handlePan,
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
  const beadTexture = useMemo(() => document.createElement("canvas"), []);
  const columnLabelTexture = useMemo(
    () => createColumnLabelTexture(cols, boardTheme),
    [boardTheme, cols],
  );
  const rowLabelTexture = useMemo(
    () => createRowLabelTexture(rows, boardTheme),
    [boardTheme, rows],
  );
  const {
    handleTouchPinch,
    removeTouchPointer,
    resetPinchIfIdle,
    updateTouchPointer,
  } = useTouchPinch({
    containerRef,
    onPinchMove: (points) => {
      markNavigationActivity();
      handlePinchMove(points);
    },
    onPinchStart: () => {
      panPointerRef.current = null;
      finishPainting();
      setHoveredCell(null);
    },
  });
  const gridOrigin = getGridOrigin();
  const renderBeadCodes = useBeadCodeRendering(view.scale) && !isNavigating;
  const showCellHover = shouldShowCellHover(tool, isTemporaryPan);
  const canvasCursor = getCanvasCursor({
    hoveredCell: showCellHover ? hoveredCell : null,
    isDraggable,
    isMovingSelection,
    selection,
    tool,
  });

  useLayoutEffect(() => {
    syncBeadTexture({
      beads: displayedBeads,
      canvas: beadTexture,
      cols,
      previousBeads: previousTextureBeadsRef.current,
      rows,
    });
    previousTextureBeadsRef.current = displayedBeads;
    boardLayerRef.current?.batchDraw();
  }, [beadTexture, cols, displayedBeads, rows]);

  useEffect(() => {
    if (!showCellHover) {
      setHoveredCell(null);
    }
  }, [showCellHover]);

  useEffect(
    () => () => {
      if (pendingEditFrameRef.current !== null) {
        cancelAnimationFrame(pendingEditFrameRef.current);
      }

      if (navigationEndTimerRef.current !== null) {
        clearTimeout(navigationEndTimerRef.current);
      }
    },
    [],
  );

  function getPointFromPointer(
    event: Pick<PointerEvent, "clientX" | "clientY">,
  ) {
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

  function getCellFromPointer(
    event: Pick<PointerEvent, "clientX" | "clientY">,
  ) {
    const point = getPointFromPointer(event);

    if (!point) {
      return null;
    }

    return getGridCellFromPoint({
      point,
      view: getView(),
      rows,
      cols,
    });
  }

  function updateHoveredCell(cell: GridCell | null) {
    setHoveredCell((current) => {
      if (current && cell && isSameCell(current, cell)) {
        return current;
      }

      return cell;
    });
  }

  function moveSelection(nextBeads: CanvasState) {
    if (props.mode === "editable") {
      props.onMoveSelection(nextBeads);
    }
  }

  function queueEditCells(cells: readonly GridCell[]) {
    if (props.mode !== "editable") {
      return;
    }

    for (const cell of cells) {
      const key = cell.row * cols + cell.column;

      if (pendingEditKeysRef.current.has(key)) {
        continue;
      }

      pendingEditKeysRef.current.add(key);
      pendingEditCellsRef.current.push(cell);
    }

    if (
      pendingEditCellsRef.current.length === 0 ||
      pendingEditFrameRef.current !== null
    ) {
      return;
    }

    pendingEditFrameRef.current = requestAnimationFrame(() => {
      pendingEditFrameRef.current = null;
      flushPendingEditCells();
    });
  }

  function flushPendingEditCells() {
    if (props.mode !== "editable") {
      return;
    }

    if (pendingEditFrameRef.current !== null) {
      cancelAnimationFrame(pendingEditFrameRef.current);
      pendingEditFrameRef.current = null;
    }

    const cells = pendingEditCellsRef.current;
    pendingEditCellsRef.current = [];
    pendingEditKeysRef.current.clear();

    if (cells.length > 0) {
      props.onEditCells(cells);
    }
  }

  function finishPainting() {
    if (!isPaintingRef.current || props.mode !== "editable") {
      return;
    }

    flushPendingEditCells();
    props.onEditEnd();
    isPaintingRef.current = false;
    lastPaintCellRef.current = null;
  }

  function paintThroughPointerSamples(event: PointerEvent) {
    const samples = event.getCoalescedEvents?.() ?? [];
    const pointerSamples = samples.length > 0 ? samples : [event];

    for (const sample of pointerSamples) {
      const cell = getCellFromPointer(sample);

      if (!cell) {
        lastPaintCellRef.current = null;
        continue;
      }

      const previous = lastPaintCellRef.current;
      const cells = previous
        ? getGridLineCells(previous, cell).slice(1)
        : [cell];

      queueEditCells(cells);
      lastPaintCellRef.current = cell;
    }
  }

  function markNavigationActivity() {
    setIsNavigating(true);

    if (navigationEndTimerRef.current !== null) {
      clearTimeout(navigationEndTimerRef.current);
    }

    navigationEndTimerRef.current = setTimeout(() => {
      navigationEndTimerRef.current = null;
      setIsNavigating(false);
    }, 100);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const nativeEvent = event.nativeEvent;

    updateTouchPointer(nativeEvent);

    if (event.button === 0) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (handleTouchPinch()) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (isDraggable) {
      panPointerRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      setIsNavigating(true);
      setHoveredCell(null);
      return;
    }

    if (props.mode !== "editable") {
      return;
    }

    if (tool === "picker") {
      const cell = getCellFromPointer(nativeEvent);

      if (cell) {
        props.onPickCell(cell);
      }

      return;
    }

    if (tool === "select") {
      const cell = getCellFromPointer(nativeEvent);
      updateHoveredCell(cell);
      beginSelection(cell);
      return;
    }

    if (!isEditTool(tool) || isTemporaryPan) {
      return;
    }

    isPaintingRef.current = true;
    lastPaintCellRef.current = null;
    props.onEditStart();
    paintThroughPointerSamples(nativeEvent);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const nativeEvent = event.nativeEvent;

    updateTouchPointer(nativeEvent);

    if (handleTouchPinch()) {
      return;
    }

    const panPointer = panPointerRef.current;

    if (panPointer?.pointerId === event.pointerId) {
      handlePan({
        x: event.clientX - panPointer.clientX,
        y: event.clientY - panPointer.clientY,
      });
      panPointer.clientX = event.clientX;
      panPointer.clientY = event.clientY;
      return;
    }

    const cell = getCellFromPointer(nativeEvent);

    if (showCellHover) {
      updateHoveredCell(cell);
    }

    if (props.mode !== "editable") {
      return;
    }

    if (tool === "select") {
      updateSelection(cell);
      return;
    }

    if (isEditTool(tool) && isPaintingRef.current) {
      paintThroughPointerSamples(nativeEvent);
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    removeTouchPointer(event.nativeEvent);
    resetPinchIfIdle(resetPinch);

    if (panPointerRef.current?.pointerId === event.pointerId) {
      panPointerRef.current = null;
      setIsNavigating(false);
    }

    finishPainting();

    if (tool === "select") {
      finishSelection();
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    setHoveredCell(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    removeTouchPointer(event.nativeEvent);
    resetPinch();
    panPointerRef.current = null;
    setIsNavigating(false);
    finishPainting();
    clearGesture();
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const point = getPointFromPointer(event.nativeEvent);

    if (!point) {
      return;
    }

    markNavigationActivity();
    navigateWithWheel(event.nativeEvent, point);
  }

  return (
    <div
      className="h-full w-full touch-none overflow-hidden overscroll-none"
      ref={containerRef}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <Stage
        style={{
          cursor: canvasCursor,
          touchAction: "none",
        }}
        width={stageSize.width}
        height={stageSize.height}
      >
        <Layer listening={false} ref={boardLayerRef}>
          <Group x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}>
            <Rect
              fill={drawingPalette.cellBackground}
              height={rows * cellSize}
              width={cols * cellSize}
              x={gridOrigin.x}
              y={gridOrigin.y}
            />
            <Shape
              listening={false}
              sceneFunc={(context) => {
                drawBeadTexture(context, beadTexture, rows, cols);
              }}
            />
            <Shape
              listening={false}
              sceneFunc={(context) => {
                drawGridLines(context, rows, cols, boardTheme);
              }}
            />
            <KonvaImage image={columnLabelTexture} x={0} y={0} />
            <KonvaImage
              image={columnLabelTexture}
              x={0}
              y={(rows + 1) * cellSize}
            />
            <KonvaImage image={rowLabelTexture} x={0} y={0} />
            <KonvaImage
              image={rowLabelTexture}
              x={(cols + 1) * cellSize}
              y={0}
            />
          </Group>
        </Layer>
        <Layer listening={false} visible={renderBeadCodes}>
          <Group x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}>
            <Shape
              listening={false}
              sceneFunc={(context) => {
                drawVisibleBeadCodes({
                  beads: displayedBeads,
                  cols,
                  context,
                  rows,
                  view,
                  viewport: stageSize,
                });
              }}
            />
          </Group>
        </Layer>
        <Layer listening={false}>
          <Group x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale}>
            {showCellHover && hoveredCell ? (
              <>
                <Rect
                  x={gridOrigin.x + hoveredCell.column * cellSize + 1}
                  y={gridOrigin.y + hoveredCell.row * cellSize + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  stroke={interactionPalette.hoverOuterStroke}
                  strokeWidth={2}
                />
                <Rect
                  x={gridOrigin.x + hoveredCell.column * cellSize + 2.5}
                  y={gridOrigin.y + hoveredCell.row * cellSize + 2.5}
                  width={cellSize - 5}
                  height={cellSize - 5}
                  stroke={interactionPalette.hoverInnerStroke}
                  strokeWidth={1}
                />
              </>
            ) : null}
            {tool === "select" && selectionBox ? (
              <Rect
                {...getSelectionBoxRect(selectionBox)}
                fill={interactionPalette.selectionFill}
                stroke={interactionPalette.selectionStroke}
                strokeWidth={1.5}
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
              />
            ) : null}
            {tool === "select" && selection && moveTargetOrigin ? (
              <Shape
                listening={false}
                sceneFunc={(context) => {
                  context.save();
                  context.globalAlpha = 0.72;

                  for (const item of selection.items) {
                    context.fillStyle = item.fill.hex;
                    context.fillRect(
                      gridOrigin.x +
                        (moveTargetOrigin.column + item.columnOffset) *
                          cellSize +
                        1,
                      gridOrigin.y +
                        (moveTargetOrigin.row + item.rowOffset) * cellSize +
                        1,
                      cellSize - 1,
                      cellSize - 1,
                    );
                  }

                  context.restore();
                }}
              />
            ) : null}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

function shouldShowCellHover(tool: CanvasTool, isTemporaryPan: boolean) {
  return tool !== "pan" && !isTemporaryPan;
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
