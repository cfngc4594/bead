import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { DISCOVER_COLLECTION_PREVIEW_LIMIT } from "@bead/core/discover";
import { Skeleton } from "@bead/ui/components/skeleton";
import { cn } from "@bead/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import type { ReactNode } from "react";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { formatRelativeTime } from "@/features/bead/lib/format-relative-time";

type CollectionPreviewProject = {
  id: string;
  sizeId: CanvasSizeId;
  snapshot: CanvasSnapshot;
};

export type CollectionCardModel = {
  id: string;
  title: string;
  previewProjects: CollectionPreviewProject[];
  projectCount: number;
};

type CollectionCardRoute = "/discover/collections/$collectionId";

type CollectionCardBaseProps = {
  actions?: ReactNode;
  collection: CollectionCardModel;
  dropTarget?: boolean;
  onOpen?: (source: "preview" | "title") => void;
  timestamp: number;
  timestampLabel: string;
};

type CollectionCardProps = CollectionCardBaseProps &
  (
    | {
        onActivate: (source: "preview" | "title") => void;
        route?: never;
      }
    | {
        onActivate?: never;
        route: CollectionCardRoute;
      }
  );

export function toCollectionCardModel(
  collection: { id: string; title: string; projectIds: readonly string[] },
  projects: Array<{
    id: string;
    sizeId: CanvasSizeId;
    snapshots: CanvasSnapshot[];
    currentIndex: number;
  }>,
): CollectionCardModel {
  return {
    id: collection.id,
    title: collection.title,
    projectCount: collection.projectIds.length,
    previewProjects: projects
      .slice(0, DISCOVER_COLLECTION_PREVIEW_LIMIT)
      .map((project) => ({
        id: project.id,
        sizeId: project.sizeId,
        snapshot: project.snapshots[project.currentIndex],
      })),
  };
}

export function CollectionCard({
  actions,
  collection,
  dropTarget = false,
  onActivate,
  onOpen,
  route,
  timestamp,
  timestampLabel,
}: CollectionCardProps) {
  const preview = <CollectionPreview projects={collection.previewProjects} />;
  const meta = (
    <>
      <p className="truncate font-medium text-sm leading-4">
        {collection.title}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-2 text-muted-foreground text-xs leading-4">
        <span className="flex h-4 shrink-0 items-center rounded-sm bg-muted px-1.5 font-medium text-foreground tabular-nums">
          {collection.projectCount} 个作品
        </span>
        <time className="truncate" dateTime={new Date(timestamp).toISOString()}>
          {formatRelativeTime(timestamp)}
          {timestampLabel}
        </time>
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50",
        dropTarget && "border-primary ring-2 ring-primary/30",
      )}
      data-collection-id={collection.id}
    >
      {onActivate ? (
        <button
          aria-label={`打开合集 ${collection.title}`}
          className="block w-full bg-muted/30 text-left outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            onOpen?.("preview");
            onActivate("preview");
          }}
          type="button"
        >
          {preview}
        </button>
      ) : (
        <Link
          aria-label={`打开合集 ${collection.title}`}
          className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => onOpen?.("preview")}
          params={{ collectionId: collection.id }}
          to={route}
        >
          {preview}
        </Link>
      )}

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        {onActivate ? (
          <button
            className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => {
              onOpen?.("title");
              onActivate("title");
            }}
            type="button"
          >
            {meta}
          </button>
        ) : (
          <Link
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => onOpen?.("title")}
            params={{ collectionId: collection.id }}
            to={route}
          >
            {meta}
          </Link>
        )}

        {actions ?? null}
      </div>
    </article>
  );
}

function CollectionPreview({
  projects,
}: {
  projects: CollectionPreviewProject[];
}) {
  if (projects.length === 0) {
    return (
      <div className="grid aspect-4/3 place-items-center text-muted-foreground">
        <FolderOpen className="size-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid aspect-4/3 overflow-hidden",
        projects.length === 1 ? "grid-cols-1" : "grid-cols-2",
        projects.length > 2 && "grid-rows-2",
      )}
    >
      {projects.map((project, index) => {
        const size = getCanvasSize(project.sizeId);

        return (
          <div
            className={cn(
              "min-h-0 min-w-0 bg-muted/20",
              index % 2 === 1 && "border-l",
              index > 1 && "border-t",
              projects.length === 3 && index === 2 && "col-span-2",
            )}
            key={project.id}
          >
            <ProjectPreview
              className="p-1.5"
              cols={size.cols}
              rows={size.rows}
              snapshot={project.snapshot}
            />
          </div>
        );
      })}
    </div>
  );
}

export function CollectionCardSkeleton({
  showActions = true,
}: {
  showActions?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="grid aspect-4/3 grid-cols-2 grid-rows-2 gap-px bg-border p-3">
        {["one", "two", "three", "four"].map((item) => (
          <Skeleton className="rounded-md" key={item} />
        ))}
      </div>
      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex h-4 items-start">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex h-4 items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-sm" />
            <Skeleton className="h-3 w-18" />
          </div>
        </div>
        {showActions ? (
          <Skeleton className="size-7 shrink-0 rounded-md" />
        ) : null}
      </div>
    </article>
  );
}
