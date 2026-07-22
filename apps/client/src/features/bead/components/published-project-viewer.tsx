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
import { eq, useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
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
import { LazyCanvasBoard } from "@/features/bead/components/lazy-canvas-board";
import { expandSnapshot } from "@/features/bead/storage/project-snapshots";
import {
  addPublishedProject,
  projectsCollection,
} from "@/features/bead/storage/projects";
import type { PublishedProject } from "@/features/bead/storage/published-projects";
import { NativeBackDropdownMenu } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function PublishedProjectViewer({
  project,
}: {
  project: PublishedProject;
}) {
  const [showBeadCodes, setShowBeadCodes] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const projectId = project.id;
  const { data: addedProject } = useLiveQuery(
    (query) =>
      query
        .from({ localProject: projectsCollection })
        .where(({ localProject }) =>
          eq(localProject.sourcePublishedProjectId, projectId),
        )
        .select(({ localProject }) => ({ id: localProject.id }))
        .findOne(),
    [projectId],
  );
  const beads = useMemo(
    () =>
      expandSnapshot({
        cellCount: project.rows * project.cols,
        snapshot: project.snapshot,
      }),
    [project],
  );
  const isAdded = addedProject !== undefined;

  useEffect(() => {
    function resetViewAfterResize() {
      setResetViewAfterResizeSignal((value) => value + 1);
    }

    window.addEventListener("resize", resetViewAfterResize);
    return () => window.removeEventListener("resize", resetViewAfterResize);
  }, []);

  async function handleAddToProjects() {
    if (isAdding || isAdded) {
      return;
    }

    setIsAdding(true);

    try {
      const wasAdded = await addPublishedProject(project);

      if (!wasAdded) {
        return;
      }

      trackEvent("project_added_from_discover", {
        sizeId: project.sizeId,
      });
      toast.success("已添加到作品");
    } catch (error) {
      console.error("Unable to add published project", error);
      toast.error("添加到作品失败");
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
            isActive={!showBeadCodes}
            label={showBeadCodes ? "隐藏豆色序号" : "显示豆色序号"}
            onClick={() => setShowBeadCodes((value) => !value)}
          />
          <ViewerToolbarButton
            icon={Grid3x3}
            isActive={showGuideLines}
            label={showGuideLines ? "隐藏辅助线" : "显示辅助线"}
            onClick={() => setShowGuideLines((value) => !value)}
          />
        </div>

        <MobileViewerMenu
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onResetView={resetView}
          onShowBeadCodesChange={setShowBeadCodes}
          onShowGuideLinesChange={setShowGuideLines}
        />

        <Button
          aria-label={isAdded ? "已添加到作品" : "添加到作品"}
          disabled={isAdding || isAdded}
          onClick={() => void handleAddToProjects()}
        >
          {isAdding ? (
            <LoaderCircle className="animate-spin" />
          ) : isAdded ? (
            <Check />
          ) : (
            <LibraryBig />
          )}
          <span className="hidden sm:inline">
            {isAdding ? "正在添加" : isAdded ? "已添加" : "添加到作品"}
          </span>
        </Button>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden overscroll-none bg-muted/30">
        <LazyCanvasBoard
          rows={project.rows}
          cols={project.cols}
          beads={beads}
          tool="pan"
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onEditCell={ignoreInteraction}
          onEditEnd={ignoreInteraction}
          onEditStart={ignoreInteraction}
          onMoveSelection={ignoreInteraction}
          onPickCell={ignoreInteraction}
          selectionResetSignal={0}
          resetViewAfterResizeSignal={resetViewAfterResizeSignal}
          resetViewSignal={resetViewSignal}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md border bg-background/90 px-2 py-1 text-muted-foreground text-xs shadow-xs backdrop-blur-sm sm:block">
          只读预览 · 拖动画布，按住 Ctrl 或 ⌘ 滚动缩放
        </div>
      </section>
    </main>
  );
}

function ViewerToolbarButton({
  icon: Icon,
  isActive = false,
  label,
  onClick,
}: {
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={isActive || undefined}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileViewerMenu({
  showBeadCodes,
  showGuideLines,
  onResetView,
  onShowBeadCodesChange,
  onShowGuideLinesChange,
}: {
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
        <DropdownMenuContent align="end" className="w-40">
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
            豆色序号
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

function ignoreInteraction() {}
