import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { cn } from "@bead/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";

export type LibraryFeedItem<TProject, TCollection> =
  | {
      kind: "project";
      id: string;
      project: TProject;
      collectionId?: string;
      collectionTitle?: string;
    }
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
  onLongPressProject,
  overlay,
  renderCollection,
  renderProject,
}: {
  disabled?: boolean;
  items: Array<LibraryFeedItem<TProject, TCollection>>;
  onMergeProjects: (sourceProjectId: string, targetProjectId: string) => void;
  onAddProjectToCollection: (projectId: string, collectionId: string) => void;
  onLongPressProject?: (projectId: string) => void;
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
  const isMobile = useIsMobile();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  // Desktop-only mouse drag. Mobile long-press is reserved for multi-select.
  const mouse = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(mouse);
  const dragEnabled = !disabled && !isMobile;
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

    if (!active || !over || active.kind !== "project" || !dragEnabled) {
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
      sensors={dragEnabled ? sensors : []}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          item.kind === "project" ? (
            <LibraryProjectItem
              disabled={!dragEnabled || item.collectionId != null}
              dropHint={
                dragEnabled &&
                item.collectionId == null &&
                isDraggingProject &&
                item.id !== activeProjectId
              }
              key={`project:${item.id}`}
              onLongPress={
                onLongPressProject
                  ? () => onLongPressProject(item.id)
                  : undefined
              }
              projectId={item.id}
            >
              {(state) => renderProject(item, state)}
            </LibraryProjectItem>
          ) : (
            <LibraryCollectionItem
              collectionId={item.id}
              disabled={!dragEnabled}
              dropHint={dragEnabled && isDraggingProject}
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
  onLongPress,
  projectId,
}: {
  children: (state: {
    dropHint: boolean;
    isDragging: boolean;
    isOver: boolean;
  }) => ReactNode;
  disabled: boolean;
  dropHint: boolean;
  onLongPress?: () => void;
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
      onContextMenu={(event) => {
        // Allow card-level context menus; don't let browser menu steal focus mid-drag.
        if (isDragging) {
          event.preventDefault();
        }
      }}
      onPointerDown={(event) => {
        if (!onLongPress || event.pointerType !== "touch") {
          return;
        }

        const target = event.currentTarget;
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        let triggered = false;

        const timer = window.setTimeout(() => {
          triggered = true;
          onLongPress();
        }, 400);

        function clear() {
          window.clearTimeout(timer);
          target.removeEventListener("pointermove", onMove);
          target.removeEventListener("pointerup", onUp);
          target.removeEventListener("pointercancel", onUp);
        }

        function onMove(moveEvent: PointerEvent) {
          if (moveEvent.pointerId !== pointerId) {
            return;
          }

          const dx = Math.abs(moveEvent.clientX - startX);
          const dy = Math.abs(moveEvent.clientY - startY);

          if (dx > 10 || dy > 10) {
            clear();
          }
        }

        function onUp(upEvent: PointerEvent) {
          if (upEvent.pointerId !== pointerId) {
            return;
          }

          clear();

          if (triggered) {
            upEvent.preventDefault();
          }
        }

        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", onUp);
        target.addEventListener("pointercancel", onUp);
      }}
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      {...attributes}
      {...(disabled ? {} : listeners)}
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
