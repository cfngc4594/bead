import { cn } from "@bead/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  pointerWithin,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { useLibraryDndSensors } from "@/features/collections/hooks/use-library-dnd-sensors";

export type LibraryFeedItem<TProject, TCollection> =
  | { kind: "project"; id: string; project: TProject }
  | {
      kind: "collection";
      id: string;
      collection: TCollection;
      projects: TProject[];
    };

function projectDragId(projectId: string) {
  return `project:${projectId}`;
}

function collectionDragId(collectionId: string) {
  return `collection:${collectionId}`;
}

function parseLibraryId(
  id: string | number | null | undefined,
): { kind: "project" | "collection"; id: string } | null {
  if (typeof id !== "string") {
    return null;
  }

  if (id.startsWith("project:")) {
    return { kind: "project", id: id.slice("project:".length) };
  }

  if (id.startsWith("collection:")) {
    return { kind: "collection", id: id.slice("collection:".length) };
  }

  return null;
}

export function LibraryDndGrid<TProject, TCollection>({
  disabled = false,
  items,
  onMergeProjects,
  onAddProjectToCollection,
  overlay,
  renderCollection,
  renderProject,
}: {
  disabled?: boolean;
  items: Array<LibraryFeedItem<TProject, TCollection>>;
  onMergeProjects: (sourceProjectId: string, targetProjectId: string) => void;
  onAddProjectToCollection: (projectId: string, collectionId: string) => void;
  overlay?: (project: TProject) => ReactNode;
  renderCollection: (
    item: Extract<
      LibraryFeedItem<TProject, TCollection>,
      { kind: "collection" }
    >,
    state: { dropHint: boolean; isOver: boolean },
  ) => ReactNode;
  renderProject: (
    item: Extract<LibraryFeedItem<TProject, TCollection>, { kind: "project" }>,
    state: { dropHint: boolean; isDragging: boolean; isOver: boolean },
  ) => ReactNode;
}) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const sensors = useLibraryDndSensors();
  const isDraggingProject = activeProjectId !== null;
  const activeProject = activeProjectId
    ? items.find(
        (item): item is Extract<typeof item, { kind: "project" }> =>
          item.kind === "project" && item.id === activeProjectId,
      )?.project
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    const active = parseLibraryId(event.active.id);
    setActiveProjectId(active?.kind === "project" ? active.id : null);
  }

  function handleDragCancel() {
    setActiveProjectId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const active = parseLibraryId(event.active.id);
    const over = parseLibraryId(event.over?.id);
    setActiveProjectId(null);

    if (!active || !over || active.kind !== "project" || disabled) {
      return;
    }

    if (over.kind === "project" && active.id !== over.id) {
      onMergeProjects(active.id, over.id);
      return;
    }

    if (over.kind === "collection") {
      onAddProjectToCollection(active.id, over.id);
    }
  }

  return (
    <DndContext
      collisionDetection={(args) => {
        const pointerHits = pointerWithin(args);
        return pointerHits.length > 0 ? pointerHits : closestCenter(args);
      }}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={disabled ? [] : sensors}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          item.kind === "project" ? (
            <LibraryProjectItem
              disabled={disabled}
              dropHint={isDraggingProject && item.id !== activeProjectId}
              key={`project:${item.id}`}
              projectId={item.id}
            >
              {(state) => renderProject(item, state)}
            </LibraryProjectItem>
          ) : (
            <LibraryCollectionItem
              collectionId={item.id}
              disabled={disabled}
              dropHint={isDraggingProject}
              key={`collection:${item.id}`}
            >
              {(state) => renderCollection(item, state)}
            </LibraryCollectionItem>
          ),
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProject && overlay ? (
          <div className="cursor-grabbing opacity-90 shadow-lg">
            {overlay(activeProject)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function LibraryProjectItem({
  children,
  disabled,
  dropHint,
  projectId,
}: {
  children: (state: {
    dropHint: boolean;
    isDragging: boolean;
    isOver: boolean;
  }) => ReactNode;
  disabled: boolean;
  dropHint: boolean;
  projectId: string;
}) {
  const id = projectDragId(projectId);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id, disabled });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id, disabled });

  return (
    <motion.div
      className={cn(
        "relative touch-manipulation select-none",
        isDragging && "opacity-35",
        !disabled && "cursor-grab active:cursor-grabbing",
      )}
      layout={!isDragging}
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      {...attributes}
      {...listeners}
    >
      {children({
        dropHint,
        isDragging,
        isOver: isOver && !isDragging,
      })}
    </motion.div>
  );
}

function LibraryCollectionItem({
  children,
  collectionId,
  disabled,
  dropHint,
}: {
  children: (state: { dropHint: boolean; isOver: boolean }) => ReactNode;
  collectionId: string;
  disabled: boolean;
  dropHint: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: collectionDragId(collectionId),
    disabled,
  });

  return (
    <motion.div
      className="relative touch-manipulation"
      layout
      ref={setNodeRef}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
    >
      {children({ dropHint, isOver })}
    </motion.div>
  );
}
