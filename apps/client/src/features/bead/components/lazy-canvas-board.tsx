import { lazy, Suspense } from "react";
import type { CanvasBoardProps } from "@/features/bead/components/canvas";
import { CanvasBoardSkeleton } from "@/features/bead/components/editor-skeleton";

const CanvasBoard = lazy(() =>
  import("@/features/bead/components/canvas").then((module) => ({
    default: module.CanvasBoard,
  })),
);

export function LazyCanvasBoard(props: CanvasBoardProps) {
  return (
    <Suspense fallback={<CanvasBoardSkeleton />}>
      <CanvasBoard {...props} />
    </Suspense>
  );
}
