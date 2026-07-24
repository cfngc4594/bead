import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { cn } from "@bead/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { CheckSquare, Grid2x2, Layers, Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectCard } from "@/features/bead/components/project-card";
import { ProjectsToolbar } from "@/features/bead/components/projects-toolbar";
import {
  CollectionCard,
  toCollectionCardModel,
} from "@/features/collections/components/collection-card";
import { CollectionPanel } from "@/features/collections/components/collection-panel";
import { LibraryDndGrid } from "@/features/collections/components/library-dnd-grid";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { useLibraryFeed } from "@/features/collections/hooks/use-library-feed";
import {
  addProjectToCollection,
  createLocalCollection,
  mergeProjectsIntoCollection,
} from "@/features/collections/storage/collection-commands";
import { trackEvent } from "@/lib/analytics";

export function ProjectsPage() {
  const [titleFilter, setTitleFilter] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hasTrackedTitleFilterRef = useRef(false);
  const { collections, feedItems, hasLibrary, projectsById, sizeOptions } =
    useLibraryFeed({
      selectedSizes,
      titleFilter,
    });

  const openCollection = openCollectionId
    ? collections.find((collection) => collection.id === openCollectionId)
    : undefined;
  const openCollectionProjects = openCollection
    ? openCollection.projectIds.flatMap((projectId) => {
        const project = projectsById.get(projectId);
        return project ? [project] : [];
      })
    : [];

  function handleTitleFilterChange(nextTitleFilter: string) {
    if (
      nextTitleFilter.trim().length > 0 &&
      !hasTrackedTitleFilterRef.current
    ) {
      trackEvent("project_filter_used", { filterType: "title" });
      hasTrackedTitleFilterRef.current = true;
    }

    if (nextTitleFilter.trim().length === 0) {
      hasTrackedTitleFilterRef.current = false;
    }

    setTitleFilter(nextTitleFilter);
  }

  function handleSizeFilterChange(nextSizeFilter: string[]) {
    trackEvent(
      nextSizeFilter.length > 0
        ? "project_filter_used"
        : "project_filter_reset",
      {
        filterType: "size",
        sizeFilterCount: nextSizeFilter.length,
      },
    );
    setSelectedSizes(nextSizeFilter);
  }

  function resetFilters() {
    trackEvent("project_filter_reset", {
      hadTitleFilter: titleFilter.trim().length > 0,
      sizeFilterCount: selectedSizes.length,
    });
    setTitleFilter("");
    setSelectedSizes([]);
    hasTrackedTitleFilterRef.current = false;
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
      toast.success("已合并为合集");
      setOpenCollectionId(collection.id);
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

  function toggleProjectSelected(projectId: string) {
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

  async function createFromSelection() {
    if (selectedProjectIds.size < 2) {
      toast.error("至少选择两个作品");
      return;
    }

    try {
      const collection = await createLocalCollection({
        projectIds: [...selectedProjectIds],
      });
      trackEvent("collection_created", {
        projectCount: selectedProjectIds.size,
        source: "multi_select",
      });
      toast.success("合集已创建");
      setIsSelecting(false);
      setSelectedProjectIds(new Set());
      setOpenCollectionId(collection.id);
    } catch (error) {
      console.error("Unable to create collection", error);
      toast.error("创建合集失败");
    }
  }

  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <div className="flex flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
            {hasLibrary ? (
              <ProjectsToolbar
                onSizeFilterChange={handleSizeFilterChange}
                sizeFilter={selectedSizes}
                sizeOptions={sizeOptions}
                titleFilter={titleFilter}
                onTitleFilterChange={handleTitleFilterChange}
              />
            ) : (
              <h1 className="font-semibold text-lg tracking-tight">作品</h1>
            )}
            <div className="ml-auto flex items-center gap-2">
              {hasLibrary ? (
                <Button
                  aria-label={isSelecting ? "取消选择" : "选择作品组成合集"}
                  onClick={() => {
                    setIsSelecting((current) => !current);
                    setSelectedProjectIds(new Set());
                  }}
                  variant={isSelecting ? "secondary" : "outline"}
                >
                  {isSelecting ? (
                    <X aria-hidden="true" />
                  ) : (
                    <CheckSquare aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {isSelecting ? "取消" : "选择"}
                  </span>
                </Button>
              ) : null}
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

          {isSelecting && selectedProjectIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2">
              <p className="min-w-0 flex-1 text-sm">
                已选 {selectedProjectIds.size} 个作品
              </p>
              <Button
                disabled={selectedProjectIds.size < 2}
                onClick={() => void createFromSelection()}
                size="sm"
              >
                <Layers aria-hidden="true" />
                组成合集
              </Button>
            </div>
          ) : null}

          {hasLibrary ? (
            feedItems.length > 0 ? (
              <LibraryDndGrid
                disabled={isSelecting}
                items={feedItems}
                onAddProjectToCollection={(projectId, collectionId) =>
                  void handleAddProjectToCollection(projectId, collectionId)
                }
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
                renderCollection={(item, { isOver }) => (
                  <CollectionCard
                    actions={
                      <LocalCollectionActions
                        collection={item.collection}
                        projects={item.projects}
                      />
                    }
                    collection={toCollectionCardModel(
                      item.collection,
                      item.projects,
                    )}
                    dropTarget={isOver}
                    onActivate={() => setOpenCollectionId(item.collection.id)}
                    onOpen={(source) =>
                      trackEvent("collection_opened", {
                        projectCount: item.collection.projectIds.length,
                        source,
                      })
                    }
                    timestamp={item.collection.updatedAt}
                    timestampLabel="更新"
                  />
                )}
                renderProject={(item, { isOver }) => (
                  <div
                    className={cn(
                      "relative rounded-xl",
                      isOver && "ring-2 ring-primary/40",
                    )}
                  >
                    {isSelecting ? (
                      <button
                        aria-label={`选择 ${item.project.title}`}
                        aria-pressed={selectedProjectIds.has(item.project.id)}
                        className={cn(
                          "absolute inset-0 z-10 rounded-xl border-2 border-transparent bg-transparent",
                          selectedProjectIds.has(item.project.id) &&
                            "border-primary bg-primary/5",
                        )}
                        onClick={() => toggleProjectSelected(item.project.id)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "absolute top-2 left-2 flex size-7 items-center justify-center rounded-md border bg-background/90 shadow-xs",
                            selectedProjectIds.has(item.project.id) &&
                              "border-primary bg-primary text-primary-foreground",
                          )}
                        >
                          {selectedProjectIds.has(item.project.id) ? (
                            <CheckSquare className="size-4" />
                          ) : null}
                        </span>
                      </button>
                    ) : null}
                    <ProjectCard
                      actions={
                        isSelecting ? null : (
                          <ProjectActions project={item.project} />
                        )
                      }
                      onOpen={(source) =>
                        trackEvent("project_opened", {
                          sizeId: item.project.sizeId,
                          source,
                        })
                      }
                      openLabel="打开"
                      project={item.project}
                      route="/projects/$projectId"
                      snapshot={
                        item.project.snapshots[item.project.currentIndex]
                      }
                      timestamp={item.project.updatedAt}
                      timestampLabel="更新"
                    />
                  </div>
                )}
              />
            ) : (
              <Empty className="flex-1 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>没有匹配的内容</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    onClick={resetFilters}
                    type="button"
                    variant="outline"
                  >
                    <X aria-hidden="true" />
                    重置筛选
                  </Button>
                </EmptyContent>
              </Empty>
            )
          ) : (
            <Empty className="flex-1 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Grid2x2 />
                </EmptyMedia>
                <EmptyTitle>还没有拼豆作品</EmptyTitle>
                <EmptyDescription>
                  创建作品后，可拖到另一个作品上合并为合集。
                </EmptyDescription>
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
          )}
        </div>
      </div>

      {openCollection ? (
        <CollectionPanel
          collection={openCollection}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setOpenCollectionId(null);
            }
          }}
          open
          projects={openCollectionProjects}
        />
      ) : null}
    </main>
  );
}
