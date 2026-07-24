import { Button } from "@bead/ui/components/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@bead/ui/components/sheet";
import { cn } from "@bead/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import { FolderOpen, GripVertical, X } from "lucide-react";
import { type ButtonHTMLAttributes, useEffect, useState } from "react";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import type { Project } from "@/features/bead/storage/projects";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import {
  removeProjectFromCollection,
  reorderCollectionProjects,
} from "@/features/collections/storage/collection-commands";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";
import { NativeBackSheet } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type PanelProject = Pick<
  Project,
  "id" | "title" | "sizeId" | "snapshots" | "currentIndex" | "updatedAt"
>;

export function CollectionPanel({
  collection,
  onOpenChange,
  open,
  projects,
}: {
  collection: LocalCollection;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projects: PanelProject[];
}) {
  const [orderedProjects, setOrderedProjects] = useState(projects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const projectIds = orderedProjects.map((project) => project.id);
  const activeProject = activeProjectId
    ? (orderedProjects.find((project) => project.id === activeProjectId) ??
      null)
    : null;

  useEffect(() => {
    setOrderedProjects(projects);
  }, [projects]);

  async function removeProject(projectId: string) {
    try {
      await removeProjectFromCollection({
        collectionId: collection.id,
        projectId,
      });
      trackEvent("collection_project_removed");
      toast.success("已移出合集");

      if (collection.projectIds.length <= 2) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Unable to remove project from collection", error);
      toast.error("移出合集失败");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveProjectId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveProjectId(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProjectId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projectIds.indexOf(String(active.id));
    const newIndex = projectIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextProjects = arrayMove(orderedProjects, oldIndex, newIndex);
    const nextProjectIds = nextProjects.map((project) => project.id);
    setOrderedProjects(nextProjects);

    try {
      await reorderCollectionProjects({
        collectionId: collection.id,
        projectIds: nextProjectIds,
      });
      trackEvent("collection_project_reordered");
    } catch (error) {
      console.error("Unable to reorder collection project", error);
      setOrderedProjects(projects);
      toast.error("调整顺序失败");
    }
  }

  return (
    <NativeBackSheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full gap-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b">
          <div className="flex items-start gap-2 pr-8">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{collection.title}</SheetTitle>
              <SheetDescription>
                {orderedProjects.length} 个作品 · 拖动手柄排序，点移除回到作品库
              </SheetDescription>
            </div>
            <LocalCollectionActions
              collection={collection}
              onDeleted={() => onOpenChange(false)}
              projects={orderedProjects}
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {orderedProjects.length > 0 ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragCancel={handleDragCancel}
              onDragEnd={(event) => void handleDragEnd(event)}
              onDragStart={handleDragStart}
              sensors={sensors}
            >
              <SortableContext
                items={projectIds}
                strategy={verticalListSortingStrategy}
              >
                <ul className="grid gap-3">
                  {orderedProjects.map((project) => (
                    <SortableCollectionProject
                      key={project.id}
                      onRemove={() => void removeProject(project.id)}
                      project={project}
                    />
                  ))}
                </ul>
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                {activeProject ? (
                  <CollectionProjectRow
                    className="cursor-grabbing shadow-lg"
                    project={activeProject}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="grid place-items-center gap-2 py-16 text-muted-foreground">
              <FolderOpen className="size-8" strokeWidth={1.5} />
              <p className="text-sm">合集是空的</p>
            </div>
          )}
        </div>
      </SheetContent>
    </NativeBackSheet>
  );
}

function SortableCollectionProject({
  onRemove,
  project,
}: {
  onRemove: () => void;
  project: PanelProject;
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
    <li
      className={cn(isDragging && "opacity-40")}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CollectionProjectRow
        dragHandleProps={{ ...attributes, ...listeners }}
        onRemove={onRemove}
        project={project}
      />
    </li>
  );
}

function CollectionProjectRow({
  className,
  dragHandleProps,
  onRemove,
  project,
}: {
  className?: string;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onRemove?: () => void;
  project: PanelProject;
}) {
  const size = getCanvasSize(project.sizeId);
  const snapshot = project.snapshots[project.currentIndex];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card p-2",
        className,
      )}
    >
      <button
        aria-label={`拖动排序 ${project.title}`}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-ring/50"
        type="button"
        {...dragHandleProps}
      >
        <GripVertical className="size-4" />
      </button>

      <Link
        aria-label={`打开 ${project.title}`}
        className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted/30 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        params={{ projectId: project.id }}
        to="/projects/$projectId"
      >
        <ProjectPreview
          className="p-1"
          cols={size.cols}
          rows={size.rows}
          snapshot={snapshot}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{project.title}</p>
        <p className="text-muted-foreground text-xs">{size.title}</p>
      </div>

      {onRemove ? (
        <Button
          aria-label="移出合集"
          onClick={onRemove}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
