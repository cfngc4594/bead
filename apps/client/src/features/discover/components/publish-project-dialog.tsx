import { Button } from "@bead/ui/components/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen, LoaderCircle, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import {
  getFilledCount,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { usePublishDiscoverProjects } from "@/features/discover/api/discover-queries";
import { createPublishInput } from "@/features/discover/lib/create-publish-input";
import { NativeBackDialog } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

export function PublishProjectDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const publishMutation = usePublishDiscoverProjects();
  const { data: projects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          sizeId: project.sizeId,
          title: project.title,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        })),
    [],
  );
  const publishableProjects = projects.filter(
    (project) => getFilledCount(project) > 0,
  );
  const isPublishing = publishMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPublishing) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function toggleProject(projectId: string) {
    setSelectedProjectIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(projectId)) {
        nextIds.delete(projectId);
      } else {
        nextIds.add(projectId);
      }

      return nextIds;
    });
  }

  async function handlePublish() {
    if (selectedProjectIds.size === 0 || isPublishing) {
      return;
    }

    const selectedProjects = publishableProjects.filter((project) =>
      selectedProjectIds.has(project.id),
    );

    try {
      await publishMutation.mutateAsync(
        selectedProjects.map(createPublishInput),
      );
      trackEvent("project_published", {
        projectCount: selectedProjects.length,
        source: "discover_dialog",
      });
      toast.success(
        selectedProjects.length === 1
          ? "作品已发布到发现"
          : `已发布 ${selectedProjects.length} 个作品`,
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to publish bead projects", error);
      toast.error("发布作品失败");
    }
  }

  return (
    <NativeBackDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>发布到发现</DialogTitle>
          <DialogDescription>
            选择一个或多个作品。每次发布都会创建一份独立快照。
          </DialogDescription>
        </DialogHeader>

        {publishableProjects.length > 0 ? (
          <ScrollArea className="-mx-1 min-h-0">
            <div className="grid gap-3 px-1 pb-1 sm:grid-cols-2">
              {publishableProjects.map((project) => {
                const isSelected = selectedProjectIds.has(project.id);
                const size = getCanvasSize(project.sizeId);

                return (
                  <button
                    aria-label={`${isSelected ? "取消选择" : "选择"}「${project.title}」`}
                    aria-pressed={isSelected}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border bg-card text-left shadow-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 hover:border-primary/50 hover:bg-muted/20",
                      isSelected && "border-primary ring-1 ring-primary",
                    )}
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    type="button"
                  >
                    <div className="aspect-4/3 bg-muted/30">
                      <ProjectPreview
                        cols={size.cols}
                        rows={size.rows}
                        snapshot={project.snapshots[project.currentIndex]}
                      />
                    </div>
                    <div className="flex items-center gap-3 border-t px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {project.title}
                        </p>
                        <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
                          {size.title}
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input",
                          isSelected &&
                            "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {isSelected ? <Check className="size-3.5" /> : null}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <Empty className="min-h-64 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>还没有可发布的作品</EmptyTitle>
              <EmptyDescription>
                {projects.length > 0
                  ? "先继续编辑一个空白作品，再把它发布到发现。"
                  : "先完成一个拼豆作品，再把它发布到发现。"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link
                  onClick={() =>
                    trackEvent("project_new_clicked", {
                      source: "publish_dialog",
                    })
                  }
                  to={projects.length > 0 ? "/projects" : "/projects/new"}
                >
                  <Plus aria-hidden="true" />
                  {projects.length > 0 ? "继续创作" : "新建作品"}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        <DialogFooter>
          <Button
            disabled={isPublishing}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={selectedProjectIds.size === 0 || isPublishing}
            onClick={() => void handlePublish()}
            type="button"
          >
            {isPublishing ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Upload />
            )}
            {isPublishing
              ? "正在发布"
              : selectedProjectIds.size > 0
                ? `发布 ${selectedProjectIds.size} 个作品`
                : "发布作品"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </NativeBackDialog>
  );
}
