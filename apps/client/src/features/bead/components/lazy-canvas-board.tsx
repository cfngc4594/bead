import { Skeleton } from "@bead/ui/components/skeleton";
import { lazy, Suspense, useRef } from "react";
import type { CanvasBoardProps } from "@/features/bead/components/canvas";
import { useStageSize } from "@/features/bead/hooks/use-stage-size";
import {
  getBoardSize,
  getInitialView,
} from "@/features/bead/lib/canvas-geometry";

const CanvasBoard = lazy(() =>
  import("@/features/bead/components/canvas").then((module) => ({
    default: module.CanvasBoard,
  })),
);

export function LazyCanvasBoard(props: CanvasBoardProps) {
  return (
    <Suspense
      fallback={<CanvasBoardSkeleton cols={props.cols} rows={props.rows} />}
    >
      <CanvasBoard {...props} />
    </Suspense>
  );
}

function CanvasBoardSkeleton({ rows, cols }: { rows: number; cols: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isStageMeasured, stageSize } = useStageSize({
    containerRef,
    initialViewport: { width: 1, height: 1 },
  });
  const board = getBoardSize(rows, cols);
  const view = isStageMeasured ? getInitialView(rows, cols, stageSize) : null;

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden overscroll-none"
      ref={containerRef}
    >
      {view ? (
        <Skeleton
          aria-hidden="true"
          className="absolute rounded-sm"
          style={{
            height: board.height * view.scale,
            left: view.x,
            top: view.y,
            width: board.width * view.scale,
          }}
        />
      ) : null}
    </div>
  );
}
