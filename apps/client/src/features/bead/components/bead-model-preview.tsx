import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { Spinner } from "@bead/ui/components/spinner";
import { ToggleGroup, ToggleGroupItem } from "@bead/ui/components/toggle-group";
import { cn } from "@bead/ui/lib/utils";
import { CircleAlert, CircleDot } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { NormalTextureStatus } from "@/features/bead/components/pressed-surface-mesh";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";
import {
  type ModelPreviewMode,
  modelPreviewModes,
} from "@/features/bead/lib/model-preview-modes";
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
  onModeChange: (mode: ModelPreviewMode) => void;
};

export function BeadModelPreview({
  className,
  rows,
  cols,
  resetViewSignal,
  beads,
  mode,
  onModeChange,
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

  function handleModeChange(value: string) {
    const nextMode = modelPreviewModes.find((item) => item.id === value)?.id;

    if (nextMode) {
      onModeChange(nextMode);
    }
  }

  return (
    <section
      aria-label="3D 预览"
      className={cn(
        "relative h-full min-h-0 w-full touch-none overflow-hidden overscroll-none bg-muted/30",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-2">
        <ToggleGroup
          aria-label="3D 预览效果"
          className="pointer-events-auto max-w-full gap-0.5 overflow-hidden border bg-background/90 p-1 shadow-sm backdrop-blur-sm"
          onValueChange={handleModeChange}
          type="single"
          value={mode}
          variant="default"
        >
          {modelPreviewModes.map((item) => (
            <ToggleGroupItem
              aria-label={item.label}
              className="h-7 rounded-md px-2 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              key={item.id}
              value={item.id}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {hasBeads ? (
        <Suspense fallback={<ModelPreviewStatus label="正在准备 3D 预览" />}>
          <BeadModelScene
            beads={beads}
            cols={cols}
            mode={mode}
            onTextureStatusChange={handleTextureStatusChange}
            resetViewSignal={resetViewSignal}
            rows={rows}
          />
        </Suspense>
      ) : (
        <Empty className="h-full pt-12">
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
