import { cn } from "@bead/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";

export type LibraryFeedItem =
  | { kind: "project"; id: string }
  | { kind: "collection"; id: string };

function projectDragId(projectId: string) {
  return `project:${projectId}`;
}

function collectionDragId(collectionId: string) {
  return `collection:${collectionId}`;
}

function parseLibraryId(
  id: string | number | null | undefined,
): LibraryFeedItem | null {
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

export function LibraryDndGrid({
  disabled = false,
  items,
  onMergeProjects,
  onAddProjectToCollection,
  overlay,
  renderCollection,
  renderProject,
}: {
  disabled?: boolean;
  items: LibraryFeedItem[];
  onMergeProjects: (sourceProjectId: string, targetProjectId: string) => void;
  onAddProjectToCollection: (projectId: string, collectionId: string) => void;
  overlay?: (active: LibraryFeedItem | null) => ReactNode;
  renderCollection: (
    collectionId: string,
    state: { isOver: boolean },
  ) => ReactNode;
  renderProject: (
    projectId: string,
    state: { isDragging: boolean; isOver: boolean },
  ) => ReactNode;
}) {
  const [activeItem, setActiveItem] = useState<LibraryFeedItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(parseLibraryId(event.active.id));
  }

  function handleDragCancel() {
    setActiveItem(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const active = parseLibraryId(event.active.id);
    const over = parseLibraryId(event.over?.id);
    setActiveItem(null);

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
              key={`project:${item.id}`}
              projectId={item.id}
            >
              {(state) => renderProject(item.id, state)}
            </LibraryProjectItem>
          ) : (
            <LibraryCollectionItem
              collectionId={item.id}
              disabled={disabled}
              key={`collection:${item.id}`}
            >
              {(state) => renderCollection(item.id, state)}
            </LibraryCollectionItem>
          ),
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem && overlay ? (
          <div className="cursor-grabbing opacity-90 shadow-lg">
            {overlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function LibraryProjectItem({
  children,
  disabled,
  projectId,
}: {
  children: (state: { isDragging: boolean; isOver: boolean }) => ReactNode;
  disabled: boolean;
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
        "relative touch-manipulation",
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
      {children({ isDragging, isOver: isOver && !isDragging })}
    </motion.div>
  );
}

function LibraryCollectionItem({
  children,
  collectionId,
  disabled,
}: {
  children: (state: { isOver: boolean }) => ReactNode;
  collectionId: string;
  disabled: boolean;
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
      {children({ isOver })}
    </motion.div>
  );
}
