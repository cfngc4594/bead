import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@bead/ui/components/drawer";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@bead/ui/components/sheet";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { cn } from "@bead/ui/lib/utils";
import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import { FolderOpen, GripVertical } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type ComponentType,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import type { Project } from "@/features/bead/storage/projects";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { useLibraryDndSensors } from "@/features/collections/hooks/use-library-dnd-sensors";
import {
  removeProjectFromCollection,
  reorderCollectionProjects,
} from "@/features/collections/storage/collection-commands";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";
import {
  NativeBackDrawer,
  NativeBackSheet,
} from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type PanelProject = Pick<
  Project,
  "id" | "title" | "sizeId" | "snapshots" | "currentIndex" | "updatedAt"
>;

const CollectionDragFeedbackContext = createContext(true);

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
  const isMobile = useIsMobile();
  const [orderedProjects, setOrderedProjects] = useState(projects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isOutsidePanel, setIsOutsidePanel] = useState(false);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isOutsidePanelRef = useRef(false);
  const sensors = useLibraryDndSensors({ withKeyboard: true });
  const projectIds = orderedProjects.map((project) => project.id);
  const activeProject = activeProjectId
    ? (orderedProjects.find((project) => project.id === activeProjectId) ??
      null)
    : null;
  const isDragging = activeProjectId !== null;

  useEffect(() => {
    setOrderedProjects(projects);
  }, [projects]);

  function syncOutsideState(outside: boolean) {
    isOutsidePanelRef.current = outside;
    setIsOutsidePanel((current) => (current === outside ? current : outside));
  }

  function isUngroupPointer(x: number, y: number) {
    const panelRect = panelRef.current?.getBoundingClientRect();
    const listRect = listRef.current?.getBoundingClientRect();

    if (!panelRect) {
      return false;
    }

    // Header / area above the list counts as ungroup (natural “drag up” on bottom drawer).
    if (listRect && y < listRect.top) {
      return true;
    }

    return (
      x < panelRect.left ||
      x > panelRect.right ||
      y < panelRect.top ||
      y > panelRect.bottom
    );
  }

  const collisionDetection: CollisionDetection = (args) => {
    const { pointerCoordinates } = args;

    if (
      pointerCoordinates &&
      isUngroupPointer(pointerCoordinates.x, pointerCoordinates.y)
    ) {
      isOutsidePanelRef.current = true;
      return [];
    }

    isOutsidePanelRef.current = false;

    // Only reorder when the pointer is directly over another row — no closestCenter
    // fallback, so dragging up toward the exit does not flash reorder targets.
    return pointerWithin(args);
  };

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

  function resetDragState() {
    setActiveProjectId(null);
    setDragPosition(null);
    syncOutsideState(false);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveProjectId(String(event.active.id));
    syncOutsideState(false);

    const activator = event.activatorEvent;
    if (activator instanceof PointerEvent) {
      setDragPosition({ x: activator.clientX, y: activator.clientY });
    } else if (activator instanceof TouchEvent) {
      const touch = activator.touches[0] ?? activator.changedTouches[0];
      if (touch) {
        setDragPosition({ x: touch.clientX, y: touch.clientY });
      }
    } else if (activator instanceof MouseEvent) {
      setDragPosition({ x: activator.clientX, y: activator.clientY });
    }
  }

  function handleDragCancel() {
    resetDragState();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const projectId = String(active.id);
    const shouldUngroup = isOutsidePanelRef.current;
    resetDragState();

    if (shouldUngroup) {
      await removeProject(projectId);
      return;
    }

    const overProjectId = over ? String(over.id) : null;
    if (
      overProjectId === null ||
      overProjectId === projectId ||
      !projectIds.includes(overProjectId)
    ) {
      return;
    }

    const oldIndex = projectIds.indexOf(projectId);
    const newIndex = projectIds.indexOf(overProjectId);

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

  // Keep overlay locked to the real finger/cursor. Vaul drawer transforms break
  // DragOverlay's default positioning inside the panel.
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const updateFromClient = (x: number, y: number) => {
      setDragPosition({ x, y });

      const panelRect = panelRef.current?.getBoundingClientRect();
      const listRect = listRef.current?.getBoundingClientRect();
      const outside = panelRect
        ? (listRect != null && y < listRect.top) ||
          x < panelRect.left ||
          x > panelRect.right ||
          y < panelRect.top ||
          y > panelRect.bottom
        : false;

      isOutsidePanelRef.current = outside;
      setIsOutsidePanel((current) => (current === outside ? current : outside));
    };

    const onPointerMove = (event: PointerEvent) => {
      updateFromClient(event.clientX, event.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        updateFromClient(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isDragging]);

  const panel = (
    <CollectionPanelFrame
      Description={isMobile ? DrawerDescription : SheetDescription}
      Header={isMobile ? DrawerHeader : SheetHeader}
      Title={isMobile ? DrawerTitle : SheetTitle}
      actions={
        <LocalCollectionActions
          collection={collection}
          onDeleted={() => onOpenChange(false)}
          projects={orderedProjects}
        />
      }
      description={
        isDragging && isOutsidePanel
          ? "松开即可移回作品库"
          : isMobile
            ? `${orderedProjects.length} 个作品 · 拖动手柄排序，拖到标题栏上方可移出`
            : `${orderedProjects.length} 个作品 · 拖动手柄排序，拖出面板即可移回作品库`
      }
      isDimmed={isDragging && isOutsidePanel}
      isUngroupReady={isDragging && isOutsidePanel}
      listRef={listRef}
      panelRef={panelRef}
      title={collection.title}
    >
      {orderedProjects.length > 0 ? (
        <CollectionDragFeedbackContext.Provider value={!isOutsidePanel}>
          <DndContext
            collisionDetection={collisionDetection}
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
                    project={project}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </CollectionDragFeedbackContext.Provider>
      ) : (
        <div className="grid place-items-center gap-2 py-16 text-muted-foreground">
          <FolderOpen className="size-8" strokeWidth={1.5} />
          <p className="text-sm">合集是空的</p>
        </div>
      )}
    </CollectionPanelFrame>
  );

  const dragOverlay =
    activeProject && dragPosition
      ? createPortal(
          <div
            className="pointer-events-none fixed z-200 w-[min(100vw-2rem,28rem)]"
            style={{
              left: dragPosition.x,
              top: dragPosition.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <CollectionProjectRow
              className={cn(
                "cursor-grabbing shadow-lg",
                isOutsidePanel &&
                  "border-dashed border-primary bg-primary/5 ring-2 ring-primary/30",
              )}
              dropLabel={isOutsidePanel ? "移出合集" : undefined}
              project={activeProject}
            />
          </div>,
          document.body,
        )
      : null;

  if (isMobile) {
    return (
      <>
        <NativeBackDrawer
          direction="bottom"
          dismissible={!isDragging}
          onOpenChange={onOpenChange}
          open={open}
          shouldScaleBackground={false}
        >
          <DrawerContent className="gap-0 pr-[env(safe-area-inset-right,0px)] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)] data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
            {panel}
          </DrawerContent>
        </NativeBackDrawer>
        {dragOverlay}
      </>
    );
  }

  return (
    <>
      <NativeBackSheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className="w-full gap-0 sm:max-w-md" side="right">
          {panel}
        </SheetContent>
      </NativeBackSheet>
      {dragOverlay}
    </>
  );
}

function CollectionPanelFrame({
  Description,
  Header,
  Title,
  actions,
  children,
  description,
  isDimmed,
  isUngroupReady,
  listRef,
  panelRef,
  title,
}: {
  Description: ComponentType<{ children?: ReactNode }>;
  Header: ComponentType<{ children?: ReactNode; className?: string }>;
  Title: ComponentType<{ children?: ReactNode; className?: string }>;
  actions: ReactNode;
  children: ReactNode;
  description: string;
  isDimmed: boolean;
  isUngroupReady: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  title: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
        isDimmed && "opacity-55",
      )}
      ref={panelRef}
    >
      <Header
        className={cn(
          "border-b text-left transition-colors duration-150",
          isUngroupReady && "border-primary bg-primary/5",
        )}
      >
        <div className="flex items-start gap-2 pr-8">
          <div className="min-w-0 flex-1">
            <Title className="truncate">{title}</Title>
            <Description>{description}</Description>
          </div>
          {actions}
        </div>
      </Header>

      <div className="min-h-0 flex-1 overflow-auto p-4" ref={listRef}>
        {children}
      </div>
    </div>
  );
}

function SortableCollectionProject({ project }: { project: PanelProject }) {
  const dropFeedbackEnabled = useContext(CollectionDragFeedbackContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: project.id });
  const showDropFeedback = dropFeedbackEnabled && !isDragging && isOver;

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
        className={cn(
          showDropFeedback &&
            "border-primary bg-primary/5 ring-2 ring-primary/25",
        )}
        dragHandleProps={{ ...attributes, ...listeners }}
        dropLabel={showDropFeedback ? "调整顺序" : undefined}
        project={project}
      />
    </li>
  );
}

function CollectionProjectRow({
  className,
  dragHandleProps,
  dropLabel,
  project,
}: {
  className?: string;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dropLabel?: string;
  project: PanelProject;
}) {
  const size = getCanvasSize(project.sizeId);
  const snapshot = project.snapshots[project.currentIndex];

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-xl border bg-card p-2 transition-[border-color,box-shadow,background-color] duration-150",
        className,
      )}
    >
      {dropLabel ? (
        <div className="pointer-events-none absolute inset-x-0 -top-2.5 z-10 flex justify-center">
          <span className="rounded-md bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs shadow-sm">
            {dropLabel}
          </span>
        </div>
      ) : null}

      <button
        aria-label={`拖动 ${project.title}`}
        className="flex size-8 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-ring/50"
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
    </div>
  );
}
