import type { DiscoverProject } from "@bead/core/discover";
import { Badge } from "@bead/ui/components/badge";
import { Button } from "@bead/ui/components/button";
import { Focus, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { LazyCanvasBoard } from "@/features/bead/components/lazy-canvas-board";
import { expandSnapshot } from "@/features/bead/storage/project-snapshots";
import { createProjectFromSnapshot } from "@/features/bead/storage/projects";
import {
  DiscoverProjectBackButton,
  DiscoverProjectShell,
} from "@/features/discover/components/discover-project-shell";
import { trackEvent } from "@/lib/analytics";

export function DiscoverProjectViewer({
  project,
}: {
  project: DiscoverProject;
}) {
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const size = getCanvasSize(project.sizeId);
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
      toast.success("已添加到作品");
    } catch (error) {
      console.error("Unable to add discover project", error);
      toast.error("添加作品失败");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <DiscoverProjectShell
      header={
        <>
          <DiscoverProjectBackButton />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate font-medium text-sm" title={project.title}>
              {project.title}
            </h1>
            <Badge className="hidden sm:inline-flex" variant="outline">
              只读
            </Badge>
          </div>

          <Button
            aria-label="居中显示"
            onClick={() => setResetViewSignal((value) => value + 1)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <Focus />
          </Button>

          <Button
            aria-label="添加到作品"
            disabled={isAdding}
            onClick={() => void handleAddToProjects()}
          >
            {isAdding ? <LoaderCircle className="animate-spin" /> : <Plus />}
            <span className="sm:hidden">{isAdding ? "添加中" : "添加"}</span>
            <span className="hidden sm:inline">
              {isAdding ? "正在添加" : "添加到作品"}
            </span>
          </Button>
        </>
      }
    >
      <section className="relative min-h-0 flex-1 overflow-hidden overscroll-none bg-muted/30">
        <LazyCanvasBoard
          beads={beads}
          cols={size.cols}
          mode="readonly"
          resetViewAfterResizeSignal={resetViewAfterResizeSignal}
          resetViewSignal={resetViewSignal}
          rows={size.rows}
        />
      </section>
    </DiscoverProjectShell>
  );
}
