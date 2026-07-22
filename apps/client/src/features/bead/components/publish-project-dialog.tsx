import { Badge } from "@bead/ui/components/badge";
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
import { eq, useLiveQuery } from "@tanstack/react-db";
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
import {
  publishedProjectsCollection,
  publishProjects,
} from "@/features/bead/storage/published-projects";
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
  const [isPublishing, setIsPublishing] = useState(false);
  const { data: projects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .leftJoin(
          { publishedProject: publishedProjectsCollection },
          ({ project, publishedProject }) =>
            eq(project.id, publishedProject.id),
        )
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project, publishedProject }) => ({
          id: project.id,
          sizeId: project.sizeId,
          rows: project.rows,
          cols: project.cols,
          title: project.title,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
          publishedSourceUpdatedAt: publishedProject.sourceUpdatedAt,
        })),
    [],
  );

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

    const projectIds = [...selectedProjectIds];
    setIsPublishing(true);

    try {
      await publishProjects(projectIds);
      trackEvent("project_published", {
        projectCount: projectIds.length,
        source: "discover_dialog",
      });
      toast.success(
        projectIds.length === 1
          ? "作品已发布到发现"
          : `已发布 ${projectIds.length} 个作品`,
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to publish bead projects", error);
      toast.error("发布作品失败");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <NativeBackDialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>发布到发现</DialogTitle>
          <DialogDescription>
            选择一个或多个作品。发布的是当前版本，之后可以重新发布更新。
          </DialogDescription>
        </DialogHeader>

        {projects.length > 0 ? (
          <ScrollArea className="-mx-1 min-h-0">
            <div className="grid gap-3 px-1 pb-1 sm:grid-cols-2">
              {projects.map((project) => {
                const isBlank = getFilledCount(project) === 0;
                const publishedVersion = project.publishedSourceUpdatedAt;
                const isPublished = publishedVersion !== undefined;
                const isUpToDate = publishedVersion === project.updatedAt;
                const isSelected = selectedProjectIds.has(project.id);
                const isDisabled = isBlank || isUpToDate;
                const status = isBlank
                  ? "空白作品"
                  : isUpToDate
                    ? "已发布"
                    : isPublished
                      ? "有更新"
                      : "未发布";

                return (
                  <button
                    aria-label={`${isSelected ? "取消选择" : "选择"}「${project.title}」`}
                    aria-pressed={isSelected}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border bg-card text-left shadow-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      isSelected && "border-primary ring-1 ring-primary",
                      isDisabled
                        ? "cursor-default opacity-60"
                        : "hover:border-primary/50 hover:bg-muted/20",
                    )}
                    disabled={isDisabled}
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    type="button"
                  >
                    <div className="aspect-4/3 bg-muted/30">
                      <ProjectPreview
                        cols={project.cols}
                        rows={project.rows}
                        snapshot={project.snapshots[project.currentIndex]}
                      />
                    </div>
                    <div className="flex items-center gap-3 border-t px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {project.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground tabular-nums">
                            {getCanvasSize(project.sizeId).title}
                          </span>
                          <Badge
                            variant={
                              isPublished && !isUpToDate
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </div>
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
                先完成一个拼豆作品，再把它带到发现页。
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
                  to="/projects/new"
                >
                  <Plus aria-hidden="true" />
                  新建作品
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
