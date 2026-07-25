import type { DiscoverProject } from "@bead/core/discover";
import { Badge } from "@bead/ui/components/badge";
import { Button } from "@bead/ui/components/button";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bead/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import { cn } from "@bead/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Focus,
  Grid3x3,
  LibraryBig,
  LoaderCircle,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { LazyCanvasBoard } from "@/features/bead/components/lazy-canvas-board";
import { expandSnapshot } from "@/features/bead/storage/project-snapshots";
import { createProjectFromSnapshot } from "@/features/bead/storage/projects";
import type { BeadCodeRenderState } from "@/features/bead/lib/bead-code-visibility";
import { getBeadCodeToggleUi } from "@/features/bead/lib/bead-code-visibility";
import { NativeBackDropdownMenu } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function DiscoverProjectViewer({
  project,
}: {
  project: DiscoverProject;
}) {
  const [showBeadCodes, setShowBeadCodes] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [beadCodeRender, setBeadCodeRender] = useState<BeadCodeRenderState>({
    preference: true,
    rendering: false,
    zoomLimited: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const size = getCanvasSize(project.sizeId);
  const beadCodeToggleUi = getBeadCodeToggleUi({
    preference: showBeadCodes,
    zoomLimited: beadCodeRender.zoomLimited,
  });
  const beads = useMemo(
    () =>
      expandSnapshot({
        cellCount: size.rows * size.cols,
        snapshot: project.snapshot,
      }),
    [project.snapshot, size.cols, size.rows],
  );

  useEffect(() => {
    function resetViewAfterResize() {
      setResetViewAfterResizeSignal((value) => value + 1);
    }

    window.addEventListener("resize", resetViewAfterResize);
    return () => window.removeEventListener("resize", resetViewAfterResize);
  }, []);

  async function handleAddToProjects() {
    if (isAdding) {
      return;
    }

    setIsAdding(true);

    try {
      await createProjectFromSnapshot({
        title: project.title,
        sizeId: project.sizeId,
        snapshot: project.snapshot,
      });
      trackEvent("project_added_from_discover", {
        sizeId: project.sizeId,
      });
      toast.success("已添加到作品库");
    } catch (error) {
      console.error("Unable to add discover project", error);
      toast.error("添加到作品库失败");
    } finally {
      setIsAdding(false);
    }
  }

  function resetView() {
    setResetViewSignal((value) => value + 1);
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden overscroll-none bg-background">
      <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回发现" to="/discover">
            <ArrowLeft />
          </Link>
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate font-medium text-sm" title={project.title}>
            {project.title}
          </h1>
          <Badge className="hidden sm:inline-flex" variant="outline">
            只读
          </Badge>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <ViewerToolbarButton
            icon={Focus}
            label="居中显示"
            onClick={resetView}
          />
          <ViewerToolbarButton
            icon={showBeadCodes ? Eye : EyeOff}
            isActive={beadCodeToggleUi.preferenceOffActive}
            label={beadCodeToggleUi.label}
            muted={beadCodeToggleUi.muted}
            onClick={() => setShowBeadCodes((value) => !value)}
            tooltip={beadCodeToggleUi.tooltip}
          />
          <ViewerToolbarButton
            icon={Grid3x3}
            isActive={showGuideLines}
            label="辅助线"
            onClick={() => setShowGuideLines((value) => !value)}
            tooltip={showGuideLines ? "隐藏辅助线" : "显示辅助线"}
          />
        </div>

        <MobileViewerMenu
          beadCodeMenuLabel={
            showBeadCodes && beadCodeRender.zoomLimited
              ? "豆色序号（放大后显示）"
              : "豆色序号"
          }
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onResetView={resetView}
          onShowBeadCodesChange={setShowBeadCodes}
          onShowGuideLinesChange={setShowGuideLines}
        />

        <Button
          aria-label="添加到作品库"
          disabled={isAdding}
          onClick={() => void handleAddToProjects()}
        >
          {isAdding ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LibraryBig />
          )}
          <span className="sm:hidden">{isAdding ? "添加中" : "添加"}</span>
          <span className="hidden sm:inline">
            {isAdding ? "正在添加" : "添加到作品库"}
          </span>
        </Button>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden overscroll-none bg-muted/30">
        <LazyCanvasBoard
          mode="readonly"
          rows={size.rows}
          cols={size.cols}
          beads={beads}
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onBeadCodesRenderChange={setBeadCodeRender}
          resetViewAfterResizeSignal={resetViewAfterResizeSignal}
          resetViewSignal={resetViewSignal}
        />
      </section>
    </main>
  );
}

function ViewerToolbarButton({
  icon: Icon,
  isActive,
  label,
  muted = false,
  onClick,
  tooltip = label,
}: {
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
  muted?: boolean;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={tooltip}
          aria-pressed={isActive}
          className={cn(muted && "opacity-60")}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function MobileViewerMenu({
  beadCodeMenuLabel,
  showBeadCodes,
  showGuideLines,
  onResetView,
  onShowBeadCodesChange,
  onShowGuideLinesChange,
}: {
  beadCodeMenuLabel: string;
  showBeadCodes: boolean;
  showGuideLines: boolean;
  onResetView: () => void;
  onShowBeadCodesChange: (value: boolean) => void;
  onShowGuideLinesChange: (value: boolean) => void;
}) {
  return (
    <div className="sm:hidden">
      <NativeBackDropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="预览设置" size="icon-sm" variant="outline">
            <SlidersHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={onResetView}>
            <Focus />
            居中显示
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={showBeadCodes}
            onCheckedChange={onShowBeadCodesChange}
          >
            <Eye />
            {beadCodeMenuLabel}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showGuideLines}
            onCheckedChange={onShowGuideLinesChange}
          >
            <Grid3x3 />
            辅助线
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </NativeBackDropdownMenu>
    </div>
  );
}
