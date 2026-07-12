import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { cn } from "@bead/ui/lib/utils";
import { CircleDot } from "lucide-react";
import { lazy, Suspense } from "react";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";
import type { BeadFill } from "@/features/bead/types";

const BeadModelScene = lazy(() =>
  preloadBeadModelScene().then((module) => ({
    default: module.BeadModelScene,
  })),
);

type BeadModelPreviewProps = {
  className?: string;
  rows: number;
  cols: number;
  resetViewSignal: number;
  beads: readonly (BeadFill | null)[];
};

export function BeadModelPreview({
  className,
  rows,
  cols,
  resetViewSignal,
  beads,
}: BeadModelPreviewProps) {
  const hasBeads = beads.some(Boolean);

  return (
    <section
      aria-label="3D 预览"
      className={cn(
        "relative h-full min-h-0 w-full touch-none overflow-hidden overscroll-none bg-muted/30",
        className,
      )}
    >
      {hasBeads ? (
        <Suspense fallback={null}>
          <BeadModelScene
            beads={beads}
            cols={cols}
            resetViewSignal={resetViewSignal}
            rows={rows}
          />
        </Suspense>
      ) : (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleDot />
            </EmptyMedia>
            <EmptyTitle>画布还是空的</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>
              铺好颜色后，这里会显示 3D 摆豆模型。
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
