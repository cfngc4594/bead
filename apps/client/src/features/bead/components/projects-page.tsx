import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@bead/ui/components/alert-dialog";
import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import {
  CheckSquare,
  Grid2x2,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectCard } from "@/features/bead/components/project-card";
import { ProjectContextMenu } from "@/features/bead/components/project-context-menu";
import { ProjectsToolbar } from "@/features/bead/components/projects-toolbar";
import {
  deleteProject,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { NativeBackAlertDialog } from "@/features/native/native-back-overlays";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function ProjectsPage() {
  const isMobile = useIsMobile();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBatchBusy, setIsBatchBusy] = useState(false);
  const { data: projects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          title: project.title,
          sizeId: project.sizeId,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        })),
    [],
  );

  const hasProjects = projects.length > 0;
  const selectableProjectIds = useMemo(
    () => projects.map((project) => project.id),
    [projects],
  );

  const selectedCount = selectedProjectIds.size;
  const allSelectableSelected =
    selectableProjectIds.length > 0 &&
    selectableProjectIds.every((id) => selectedProjectIds.has(id));

  function enterSelectMode(seedProjectId?: string) {
    setSelectMode(true);
    trackEvent("library_multiselect_entered", {
      source: seedProjectId ? "long_press" : "toolbar",
    });

    if (seedProjectId) {
      setSelectedProjectIds(new Set([seedProjectId]));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedProjectIds(new Set());
  }

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((current) => {
      const next = new Set(current);

      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }

      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedProjectIds(new Set());
      return;
    }

    setSelectedProjectIds(new Set(selectableProjectIds));
  }

  async function handleBatchDelete() {
    if (selectedCount === 0 || isBatchBusy) {
      return;
    }

    setIsBatchBusy(true);

    try {
      for (const projectId of selectedProjectIds) {
        await deleteProject(projectId);
      }
      trackEvent("library_multiselect_action", {
        action: "delete",
        count: selectedCount,
      });
      toast.success(
        selectedCount === 1 ? "作品已删除" : `已删除 ${selectedCount} 个作品`,
      );
      setIsDeleteOpen(false);
      exitSelectMode();
    } catch (error) {
      console.error("Unable to delete selected projects", error);
      toast.error("删除失败");
    } finally {
      setIsBatchBusy(false);
    }
  }

  const batchActions = selectMode && selectedCount > 0 && (
    <>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <p className="min-w-0 flex-1 font-medium text-sm tabular-nums">
          已选 {selectedCount} 项
        </p>
        <Button
          onClick={toggleSelectAll}
          size="sm"
          type="button"
          variant="ghost"
        >
          <CheckSquare aria-hidden="true" />
          {allSelectableSelected ? "取消全选" : "全选"}
        </Button>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
        <Button
          disabled={isBatchBusy}
          onClick={() => setIsDeleteOpen(true)}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 aria-hidden="true" />
          删除
        </Button>
      </div>
    </>
  );

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        {hasProjects ? (
          selectMode ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h1 className="font-semibold text-lg tracking-tight">选择作品</h1>
              <Button
                onClick={exitSelectMode}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
                取消
              </Button>
            </div>
          ) : (
            <ProjectsToolbar
              onSelectModeChange={(enabled) => {
                if (enabled) {
                  enterSelectMode();
                } else {
                  exitSelectMode();
                }
              }}
              selectMode={selectMode}
            />
          )
        ) : (
          <h1 className="font-semibold text-lg tracking-tight">作品</h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button asChild>
            <Link
              onClick={() => trackEvent("project_new_clicked")}
              to="/projects/new"
            >
              <Plus aria-hidden="true" />
              新建
            </Link>
          </Button>
        </div>
      </header>

      {!isMobile && batchActions ? (
        <div className="mx-auto w-full max-w-5xl shrink-0 px-4 pt-4 md:px-8">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-xs">
            {batchActions}
          </div>
        </div>
      ) : null}

      {hasProjects ? (
        <ScrollArea
          className={
            isMobile && selectMode && selectedCount > 0
              ? "min-h-0 flex-1 pb-28"
              : "min-h-0 flex-1"
          }
          id={TAB_CONTENT_ID}
        >
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {projects.map((project) => {
              const card = (
                <ProjectCard
                  actions={
                    selectMode ? undefined : <ProjectActions project={project} />
                  }
                  onOpen={(source) =>
                    trackEvent("project_opened", {
                      sizeId: project.sizeId,
                      source,
                    })
                  }
                  onSelectToggle={() => toggleProjectSelection(project.id)}
                  openLabel="打开"
                  project={project}
                  route="/projects/$projectId"
                  selectMode={selectMode}
                  selected={selectedProjectIds.has(project.id)}
                  snapshot={project.snapshots[project.currentIndex]}
                  timestamp={project.updatedAt}
                  timestampLabel="更新"
                />
              );

              if (selectMode) {
                return <div key={project.id}>{card}</div>;
              }

              return (
                <ProjectContextMenu key={project.id} project={project}>
                  <div>{card}</div>
                </ProjectContextMenu>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div
          className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8"
          id={TAB_CONTENT_ID}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Grid2x2 />
              </EmptyMedia>
              <EmptyTitle>暂无作品</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {isMobile && batchActions ? (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
            {batchActions}
          </div>
        </div>
      ) : null}

      {isDeleteOpen ? (
        <NativeBackAlertDialog
          open={isDeleteOpen}
          onOpenChange={(next) => {
            if (!next && isBatchBusy) {
              return;
            }
            setIsDeleteOpen(next);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除 {selectedCount} 个作品？</AlertDialogTitle>
              <AlertDialogDescription>删除后无法恢复</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBatchBusy}>取消</AlertDialogCancel>
              <Button
                disabled={isBatchBusy}
                onClick={() => void handleBatchDelete()}
                type="button"
                variant="destructive"
              >
                {isBatchBusy ? <LoaderCircle className="animate-spin" /> : null}
                {isBatchBusy ? "正在删除" : "删除"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </NativeBackAlertDialog>
      ) : null}
    </main>
  );
}
