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
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CheckSquare,
  FolderInput,
  FolderPlus,
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
import { deleteProject } from "@/features/bead/storage/projects";
import {
  CollectionCard,
  toCollectionCardModel,
} from "@/features/collections/components/collection-card";
import { CollectionContextMenu } from "@/features/collections/components/collection-context-menu";
import { JoinCollectionDialog } from "@/features/collections/components/join-collection-dialog";
import { LibraryDndGrid } from "@/features/collections/components/library-dnd-grid";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { useLibraryFeed } from "@/features/collections/hooks/use-library-feed";
import {
  addProjectToCollection,
  createLocalCollection,
  mergeProjectsIntoCollection,
} from "@/features/collections/storage/collection-commands";
import { NativeBackAlertDialog } from "@/features/native/native-back-overlays";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function ProjectsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBatchBusy, setIsBatchBusy] = useState(false);
  const { feedItems, hasLibrary } = useLibraryFeed();

  const selectableProjectIds = useMemo(
    () =>
      feedItems
        .filter((item) => item.kind === "project")
        .map((item) => item.id),
    [feedItems],
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

  async function handleMergeProjects(
    sourceProjectId: string,
    targetProjectId: string,
  ) {
    try {
      const collection = await mergeProjectsIntoCollection({
        sourceProjectId,
        targetProjectId,
      });
      trackEvent("collection_created", {
        projectCount: 2,
        source: "drag_merge",
      });
      toast.success("已合并为合集", {
        action: {
          label: "查看",
          onClick: () => {
            void navigate({
              to: "/projects/collections/$collectionId",
              params: { collectionId: collection.id },
            });
          },
        },
      });
    } catch (error) {
      console.error("Unable to merge projects", error);
      toast.error("合并合集失败");
    }
  }

  async function handleAddProjectToCollection(
    projectId: string,
    collectionId: string,
  ) {
    try {
      await addProjectToCollection({ collectionId, projectId });
      trackEvent("collection_project_added", {
        projectCount: 1,
        source: "drag",
      });
      toast.success("已加入合集");
    } catch (error) {
      console.error("Unable to add project to collection", error);
      toast.error("加入合集失败");
    }
  }

  async function handleCreateCollectionFromSelection() {
    if (selectedCount < 2 || isBatchBusy) {
      return;
    }

    setIsBatchBusy(true);

    try {
      const collection = await createLocalCollection({
        projectIds: [...selectedProjectIds],
      });
      trackEvent("collection_created", {
        projectCount: selectedCount,
        source: "multiselect",
      });
      trackEvent("library_multiselect_action", {
        action: "create_collection",
        count: selectedCount,
      });
      toast.success("已合并为合集", {
        action: {
          label: "查看",
          onClick: () => {
            void navigate({
              to: "/projects/collections/$collectionId",
              params: { collectionId: collection.id },
            });
          },
        },
      });
      exitSelectMode();
    } catch (error) {
      console.error("Unable to create collection from selection", error);
      toast.error("创建合集失败");
    } finally {
      setIsBatchBusy(false);
    }
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
          disabled={selectedCount < 2 || isBatchBusy}
          onClick={() => void handleCreateCollectionFromSelection()}
          size="sm"
          type="button"
        >
          {isBatchBusy ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <FolderPlus aria-hidden="true" />
          )}
          合并为合集
        </Button>
        <Button
          disabled={isBatchBusy}
          onClick={() => {
            trackEvent("library_multiselect_action", {
              action: "join_open",
              count: selectedCount,
            });
            setIsJoinOpen(true);
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <FolderInput aria-hidden="true" />
          加入合集…
        </Button>
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
      <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-wrap items-center gap-2 border-b px-4 pt-6 pb-5 md:justify-between md:px-8">
        {hasLibrary ? (
          selectMode ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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

      {hasLibrary ? (
        <ScrollArea
          className={
            isMobile && selectMode && selectedCount > 0
              ? "min-h-0 flex-1 pb-28"
              : "min-h-0 flex-1"
          }
          id={TAB_CONTENT_ID}
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
            <LibraryDndGrid
              disabled={selectMode}
              items={feedItems}
              onAddProjectToCollection={(projectId, collectionId) =>
                void handleAddProjectToCollection(projectId, collectionId)
              }
              onLongPressProject={(projectId) => {
                if (selectMode) {
                  toggleProjectSelection(projectId);
                  return;
                }

                enterSelectMode(projectId);
              }}
              onMergeProjects={(sourceProjectId, targetProjectId) =>
                void handleMergeProjects(sourceProjectId, targetProjectId)
              }
              overlay={(project) => (
                <ProjectCard
                  openLabel="打开"
                  onOpen={() => undefined}
                  project={project}
                  route="/projects/$projectId"
                  snapshot={project.snapshots[project.currentIndex]}
                  timestamp={project.updatedAt}
                  timestampLabel="更新"
                />
              )}
              renderCollection={(item, { dropHint, isOver }) => (
                <CollectionContextMenu
                  collection={item.collection}
                  disabled={selectMode}
                  projects={item.projects}
                >
                  <div>
                    <CollectionCard
                      actions={
                        selectMode ? undefined : (
                          <LocalCollectionActions
                            collection={item.collection}
                            projects={item.projects}
                          />
                        )
                      }
                      collection={toCollectionCardModel(
                        item.collection,
                        item.projects,
                      )}
                      dropHint={dropHint}
                      dropTarget={isOver}
                      onActivate={() => {
                        if (selectMode) {
                          return;
                        }

                        void navigate({
                          to: "/projects/collections/$collectionId",
                          params: { collectionId: item.collection.id },
                        });
                      }}
                      onOpen={(source) => {
                        if (selectMode) {
                          return;
                        }

                        trackEvent("collection_opened", {
                          projectCount: item.collection.projectIds.length,
                          source,
                        });
                      }}
                      timestamp={item.collection.updatedAt}
                      timestampLabel="更新"
                    />
                  </div>
                </CollectionContextMenu>
              )}
              renderProject={(item, { dropHint, isOver }) => {
                const card = (
                  <ProjectCard
                    actions={
                      selectMode ? undefined : (
                        <ProjectActions project={item.project} />
                      )
                    }
                    dropHint={dropHint}
                    dropTarget={isOver}
                    onOpen={(source) =>
                      trackEvent("project_opened", {
                        sizeId: item.project.sizeId,
                        source,
                      })
                    }
                    onSelectToggle={() =>
                      toggleProjectSelection(item.project.id)
                    }
                    openLabel="打开"
                    project={item.project}
                    route="/projects/$projectId"
                    selectMode={selectMode}
                    selected={selectedProjectIds.has(item.project.id)}
                    snapshot={item.project.snapshots[item.project.currentIndex]}
                    timestamp={item.project.updatedAt}
                    timestampLabel="更新"
                  />
                );

                if (selectMode) {
                  return card;
                }

                return (
                  <ProjectContextMenu project={item.project}>
                    <div>{card}</div>
                  </ProjectContextMenu>
                );
              }}
            />
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
            <EmptyContent>
              <Button asChild>
                <Link
                  onClick={() =>
                    trackEvent("project_new_clicked", { source: "empty" })
                  }
                  to="/projects/new"
                >
                  <Plus aria-hidden="true" />
                  开始拼豆
                </Link>
              </Button>
            </EmptyContent>
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

      {isJoinOpen ? (
        <JoinCollectionDialog
          onJoined={exitSelectMode}
          onOpenChange={setIsJoinOpen}
          open={isJoinOpen}
          projectIds={[...selectedProjectIds]}
        />
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
