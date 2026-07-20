import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { Spinner } from "@bead/ui/components/spinner";
import { cn } from "@bead/ui/lib/utils";
import { CircleAlert, CircleDot } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { NormalTextureStatus } from "@/features/bead/components/pressed-surface-mesh";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";
import type {
  ModelPreviewMode,
  ModelPreviewSettings,
} from "@/features/bead/lib/model-preview-config";
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
  mode: ModelPreviewMode;
  settings: ModelPreviewSettings;
};

export function BeadModelPreview({
  className,
  rows,
  cols,
  resetViewSignal,
  beads,
  mode,
  settings,
}: BeadModelPreviewProps) {
  const hasBeads = beads.some(Boolean);
  const [textureStatus, setTextureStatus] =
    useState<NormalTextureStatus>("ready");
  const handleTextureStatusChange = useCallback(
    (status: NormalTextureStatus) => setTextureStatus(status),
    [],
  );

  useEffect(() => {
    setTextureStatus(mode === "beads" ? "ready" : "loading");
  }, [mode]);

  return (
    <section
      aria-label="3D 预览"
      className={cn(
        "relative h-full min-h-0 w-full touch-none overflow-hidden overscroll-none bg-muted/30",
        className,
      )}
    >
      {hasBeads ? (
        <Suspense fallback={<ModelPreviewStatus label="正在准备 3D 预览" />}>
          <BeadModelScene
            beads={beads}
            cols={cols}
            mode={mode}
            onTextureStatusChange={handleTextureStatusChange}
            resetViewSignal={resetViewSignal}
            rows={rows}
            settings={settings}
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
              铺好颜色后，这里会显示所选的 3D 烫豆效果。
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      {hasBeads && mode !== "beads" && textureStatus === "loading" ? (
        <ModelPreviewStatus compact label="正在加载表面纹理" />
      ) : null}
      {hasBeads && mode !== "beads" && textureStatus === "error" ? (
        <ModelPreviewStatus
          compact
          error
          label="纹理加载失败，正使用基础材质"
        />
      ) : null}
    </section>
  );
}

function ModelPreviewStatus({
  compact = false,
  error = false,
  label,
}: {
  compact?: boolean;
  error?: boolean;
  label: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-0 z-5 grid place-items-center",
        compact && "inset-x-0 top-auto bottom-4",
      )}
    >
      <div className="flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
        {error ? (
          <CircleAlert aria-hidden="true" className="size-3.5" />
        ) : (
          <Spinner className="size-3.5" />
        )}
        <span>{label}</span>
      </div>
    </div>
  );
}
