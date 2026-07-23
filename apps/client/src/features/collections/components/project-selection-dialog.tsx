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
import { Input } from "@bead/ui/components/input";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen, LoaderCircle, Plus } from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { projectsCollection } from "@/features/bead/storage/projects";
import { DEFAULT_COLLECTION_TITLE } from "@/features/collections/storage/collection-commands";
import { NativeBackDialog } from "@/features/native/native-back-overlays";

export function ProjectSelectionDialog({
  collectionTitle,
  description,
  excludedProjectIds = [],
  onOpenChange,
  onSubmit,
  open,
  submitLabel,
  title,
}: {
  collectionTitle?: string;
  description: string;
  excludedProjectIds?: string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { projectIds: string[]; title?: string }) => Promise<void>;
  open: boolean;
  submitLabel: string;
  title: string;
}) {
  const [name, setName] = useState(collectionTitle ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        })),
    [],
  );
  const excludedIds = new Set(excludedProjectIds);
  const availableProjects = projects.filter(
    (project) => !excludedIds.has(project.id),
  );

  useEffect(() => {
    if (open) {
      setName(collectionTitle ?? "");
      setSelectedIds(new Set());
    }
  }, [collectionTitle, open]);

  function setOpen(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function toggleProject(projectId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }

      return next;
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedIds.size === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        projectIds: [...selectedIds],
        title: collectionTitle === undefined ? undefined : name,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to save bead collection", error);
      toast.error("保存合集失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeBackDialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[min(44rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="contents"
          id="project-selection-form"
          onSubmit={handleSubmit}
        >
          <div className="flex min-h-0 flex-col gap-3">
            {collectionTitle !== undefined ? (
              <Input
                aria-label="合集名称"
                autoFocus
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder={DEFAULT_COLLECTION_TITLE}
                value={name}
              />
            ) : null}

            {availableProjects.length > 0 ? (
              <ScrollArea className="-mx-1 min-h-0">
                <div className="grid gap-3 px-1 pb-1 sm:grid-cols-2">
                  {availableProjects.map((project) => {
                    const isSelected = selectedIds.has(project.id);
                    const size = getCanvasSize(project.sizeId);

                    return (
                      <button
                        aria-label={`${isSelected ? "取消选择" : "选择"}「${project.title}」`}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border bg-card text-left shadow-xs outline-none transition-colors hover:border-primary/50 hover:bg-muted/20 focus-visible:ring-3 focus-visible:ring-ring/50",
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
                              "flex size-4 shrink-0 items-center justify-center rounded-lg border border-input",
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
              <Empty className="min-h-56 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpen />
                  </EmptyMedia>
                  <EmptyTitle>
                    {projects.length > 0
                      ? "所有作品都已在合集中"
                      : "还没有作品"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {projects.length > 0
                      ? "可以在合集详情中继续调整作品顺序。"
                      : "先创作一个作品，再把它加入合集。"}
                  </EmptyDescription>
                </EmptyHeader>
                {projects.length === 0 ? (
                  <EmptyContent>
                    <Button asChild>
                      <Link to="/projects/new">
                        <Plus aria-hidden="true" />
                        新建作品
                      </Link>
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              disabled={selectedIds.size === 0 || isSubmitting}
              form="project-selection-form"
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
              {isSubmitting
                ? "正在保存"
                : selectedIds.size > 0
                  ? `${submitLabel} ${selectedIds.size} 个作品`
                  : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </NativeBackDialog>
  );
}
