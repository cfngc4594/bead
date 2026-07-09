import { Button } from "@bead/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { cn } from "@bead/ui/lib/utils";
import {
  ChevronDown,
  CircleDot,
  Cuboid,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import type { BeadPreviewMode } from "@/features/bead/lib/bead-model-preview-modes";
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

type PreviewOption = {
  mode: BeadPreviewMode;
  label: string;
  description: string;
  icon: LucideIcon;
};

const previewOptions: PreviewOption[] = [
  {
    mode: "beads",
    label: "摆豆",
    description: "保留豆孔间隔",
    icon: CircleDot,
  },
  {
    mode: "standard",
    label: "常规烫",
    description: "平整哑光表面",
    icon: Cuboid,
  },
  {
    mode: "glossy",
    label: "亮面烫",
    description: "平滑亮面反光",
    icon: Sparkles,
  },
];

export function BeadModelPreview({
  className,
  rows,
  cols,
  resetViewSignal,
  beads,
}: BeadModelPreviewProps) {
  const [previewMode, setPreviewMode] = useState<BeadPreviewMode>("standard");
  const hasBeads = beads.some(Boolean);

  return (
    <section
      aria-label="3D 预览"
      className={cn(
        "relative h-full min-h-0 w-full touch-none overflow-hidden overscroll-none bg-muted/30",
        className,
      )}
    >
      <PreviewOptionsPanel
        previewMode={previewMode}
        onSelectPreviewMode={setPreviewMode}
      />
      {hasBeads ? (
        <Suspense fallback={null}>
          <BeadModelScene
            beads={beads}
            cols={cols}
            previewMode={previewMode}
            resetViewSignal={resetViewSignal}
            rows={rows}
          />
        </Suspense>
      ) : (
        <Empty className="h-full">
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

function PreviewOptionsPanel({
  previewMode,
  onSelectPreviewMode,
}: {
  previewMode: BeadPreviewMode;
  onSelectPreviewMode: (mode: BeadPreviewMode) => void;
}) {
  const activeOption =
    previewOptions.find((option) => option.mode === previewMode) ??
    previewOptions[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="absolute right-3 top-3 z-10 text-sm md:right-4 md:top-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="ml-auto flex max-w-full justify-between gap-2 border bg-background/95 shadow-sm backdrop-blur data-[state=open]:[&_.preview-chevron]:rotate-180"
            type="button"
            variant="outline"
          >
            <ActiveIcon />
            <span className="min-w-0 flex-1 truncate text-left">
              {activeOption.label}
            </span>
            <ChevronDown className="preview-chevron transition-transform" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="bg-background/95 p-1.5 backdrop-blur"
        >
          <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground">
            <Cuboid className="size-4 shrink-0" />
            <span className="truncate">预览选项</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={previewMode}
            onValueChange={(mode) =>
              onSelectPreviewMode(mode as BeadPreviewMode)
            }
          >
            {previewOptions.map((option) => (
              <PreviewOptionItem key={option.mode} option={option} />
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PreviewOptionItem({ option }: { option: PreviewOption }) {
  const Icon = option.icon;

  return (
    <DropdownMenuRadioItem
      className="min-h-12 items-center gap-3 px-2.5 py-2 pr-8"
      value={option.mode}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate font-medium">{option.label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {option.description}
        </span>
      </span>
    </DropdownMenuRadioItem>
  );
}
