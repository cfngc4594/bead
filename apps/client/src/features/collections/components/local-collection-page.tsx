import { Button } from "@bead/ui/components/button";
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
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectCard } from "@/features/bead/components/project-card";
import type { Project } from "@/features/bead/storage/projects";
import { AddProjectsToCollectionDialog } from "@/features/collections/components/add-projects-to-collection-dialog";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { useLibraryDndSensors } from "@/features/collections/hooks/use-library-dnd-sensors";
import { useLocalCollection } from "@/features/collections/hooks/use-local-collections";
import { reorderCollectionProjects } from "@/features/collections/storage/collection-commands";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";
import { trackEvent } from "@/lib/analytics";

type CollectionProject = Pick<
  Project,
  "id" | "title" | "sizeId" | "snapshots" | "currentIndex" | "updatedAt"
>;

export function LocalCollectionPage({
  collectionId,
  projectsById,
}: {
  collectionId: string;
  projectsById: Map<string, CollectionProject>;
}) {
  const navigate = useNavigate();
  const { data: collections = [], isReady } = useLocalCollection(collectionId);
  const collection = collections[0];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [orderedProjectIds, setOrderedProjectIds] = useState<string[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (collection) {
      setOrderedProjectIds(collection.projectIds);
    }
  }, [collection]);

  const orderedProjects = useMemo(
    () =>
      orderedProjectIds.flatMap((projectId) => {
        const project = projectsById.get(projectId);
        return project ? [project] : [];
      }),
    [orderedProjectIds, projectsById],
  );

  const activeProject = activeProjectId
    ? (orderedProjects.find((project) => project.id === activeProjectId) ??
      null)
    : null;

  const sensors = useLibraryDndSensors();

  if (isReady && !collection) {
    return <Navigate replace to="/projects" />;
  }

  if (!collection) {
    return null;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProjectId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedProjectIds.indexOf(String(active.id));
    const newIndex = orderedProjectIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextProjectIds = arrayMove(orderedProjectIds, oldIndex, newIndex);
    setOrderedProjectIds(nextProjectIds);

    try {
      await reorderCollectionProjects({
        collectionId: collection.id,
        projectIds: nextProjectIds,
      });
      trackEvent("collection_project_reordered");
    } catch (error) {
      console.error("Unable to reorder collection project", error);
      setOrderedProjectIds(collection.projectIds);
      toast.error("调整顺序失败");
    }
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回作品库" to="/projects">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-medium text-sm" title={collection.title}>
            {collection.title}
          </h1>
          <p className="text-muted-foreground text-xs tabular-nums">
            {orderedProjects.length} 个作品
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          <Plus />
          <span className="hidden sm:inline">添加作品</span>
          <span className="sm:hidden">添加</span>
        </Button>
        <LocalCollectionActions
          collection={collection}
          onDeleted={() => void navigate({ to: "/projects" })}
          projects={orderedProjects}
        />
      </header>

      {orderedProjects.length > 0 ? (
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
            <DndContext
              collisionDetection={closestCenter}
              onDragCancel={() => setActiveProjectId(null)}
              onDragEnd={(event) => void handleDragEnd(event)}
              onDragStart={(event: DragStartEvent) => {
                setActiveProjectId(String(event.active.id));
              }}
              sensors={sensors}
            >
              <SortableContext
                items={orderedProjectIds}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedProjects.map((project) => (
                    <SortableCollectionProjectCard
                      collectionId={collection.id}
                      key={project.id}
                      project={project}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeProject ? (
                  <div className="cursor-grabbing opacity-90 shadow-lg">
                    <ProjectCard
                      openLabel="打开"
                      onOpen={() => undefined}
                      project={activeProject}
                      route="/projects/$projectId"
                      snapshot={
                        activeProject.snapshots[activeProject.currentIndex]
                      }
                      timestamp={activeProject.updatedAt}
                      timestampLabel="更新"
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      ) : (
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8">
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>暂无作品</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setIsAddOpen(true)} type="button">
                <Plus aria-hidden="true" />
                添加作品
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {isAddOpen ? (
        <AddProjectsToCollectionDialog
          collectionId={collection.id}
          collectionProjectIds={collection.projectIds}
          onOpenChange={setIsAddOpen}
          open={isAddOpen}
        />
      ) : null}
    </main>
  );
}

function SortableCollectionProjectCard({
  collectionId,
  project,
}: {
  collectionId: string;
  project: CollectionProject;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  return (
    <div
      className={cn(
        "touch-manipulation",
        isDragging && "opacity-40",
        "cursor-grab active:cursor-grabbing",
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <ProjectCard
        actions={
          <ProjectActions collectionId={collectionId} project={project} />
        }
        onOpen={(source) =>
          trackEvent("project_opened", {
            sizeId: project.sizeId,
            source: `collection_${source}`,
          })
        }
        openLabel="打开"
        project={project}
        route="/projects/$projectId"
        snapshot={project.snapshots[project.currentIndex]}
        timestamp={project.updatedAt}
        timestampLabel="更新"
      />
    </div>
  );
}

export function LocalCollectionNotFound() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>合集不存在</EmptyTitle>
            <EmptyDescription>可能已删除</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/projects">
                <ArrowLeft aria-hidden="true" />
                返回作品库
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

export type { LocalCollection };
