"use client";

import { Cuboid } from "lucide-react";
import dynamic from "next/dynamic";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { BeadModelSceneProps } from "@/features/bead/components/bead-model-scene";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";
import type { BeadFill } from "@/features/bead/types";
import { cn } from "@/lib/utils";

const BeadModelScene = dynamic<BeadModelSceneProps>(
  () => preloadBeadModelScene().then((module) => module.BeadModelScene),
  {
    loading: () => null,
    ssr: false,
  },
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
        <BeadModelScene
          beads={beads}
          cols={cols}
          resetViewSignal={resetViewSignal}
          rows={rows}
        />
      ) : (
        <Empty className="h-full rounded-none border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Cuboid />
            </EmptyMedia>
            <EmptyTitle>画布还是空的</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>
              铺好颜色后，这里会显示烫平后的薄片模型。
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
