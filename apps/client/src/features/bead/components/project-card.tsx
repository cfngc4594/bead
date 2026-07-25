import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { Skeleton } from "@bead/ui/components/skeleton";
import { cn } from "@bead/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Check, FolderOpen } from "lucide-react";
import type { ReactNode } from "react";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { formatRelativeTime } from "@/features/bead/lib/format-relative-time";
import type { Project } from "@/features/bead/storage/project-schema";

type ProjectCardProject = Pick<Project, "id" | "title" | "sizeId">;

type ProjectCardRoute = "/discover/$projectId" | "/projects/$projectId";

export function ProjectCard({
  actions,
  collectionTitle,
  dropHint = false,
  dropTarget = false,
  openLabel,
  onOpen,
  onSelectToggle,
  project,
  route,
  selected = false,
  selectMode = false,
  snapshot,
  timestamp,
  timestampLabel,
}: {
  actions?: ReactNode;
  collectionTitle?: string;
  dropHint?: boolean;
  dropTarget?: boolean;
  openLabel: string;
  onOpen: (source: "preview" | "title") => void;
  onSelectToggle?: () => void;
  project: ProjectCardProject;
  route: ProjectCardRoute;
  selected?: boolean;
  selectMode?: boolean;
  snapshot: CanvasSnapshot;
  timestamp: number;
  timestampLabel: string;
}) {
  const size = getCanvasSize(project.sizeId);

  const preview = (
    <div className="aspect-4/3">
      <ProjectPreview cols={size.cols} rows={size.rows} snapshot={snapshot} />
    </div>
  );

  const meta = (
    <>
      <p className="truncate font-medium text-sm leading-4">{project.title}</p>
      <div className="mt-0.5 flex min-w-0 items-center gap-2 text-muted-foreground text-xs leading-4">
        <span className="flex h-4 shrink-0 items-center rounded-sm bg-muted px-1.5 font-medium text-foreground tabular-nums">
          {size.title}
        </span>
        {collectionTitle ? (
          <span className="flex min-w-0 items-center gap-1 truncate">
            <FolderOpen className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{collectionTitle}</span>
          </span>
        ) : (
          <time
            className="truncate"
            dateTime={new Date(timestamp).toISOString()}
          >
            {formatRelativeTime(timestamp)}
            {timestampLabel}
          </time>
        )}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow,transform] duration-150 hover:border-primary/50",
        dropHint && !dropTarget && "border-primary/35",
        dropTarget &&
          "scale-[1.02] border-primary shadow-md ring-2 ring-primary/35",
        selectMode && selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      {dropTarget ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
          <span className="rounded-md bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs shadow-sm">
            合并为合集
          </span>
        </div>
      ) : null}

      {selectMode ? (
        <button
          aria-label={`${selected ? "取消选择" : "选择"} ${project.title}`}
          aria-pressed={selected}
          className="absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full border border-input bg-background/90 shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelectToggle?.();
          }}
          type="button"
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full border border-input",
              selected && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {selected ? <Check className="size-3" aria-hidden="true" /> : null}
          </span>
        </button>
      ) : null}

      {selectMode ? (
        <button
          aria-label={`${selected ? "取消选择" : "选择"} ${project.title}`}
          className="block w-full bg-muted/30 text-left outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => onSelectToggle?.()}
          type="button"
        >
          {preview}
        </button>
      ) : (
        <Link
          aria-label={`${openLabel} ${project.title}`}
          className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => onOpen("preview")}
          params={{ projectId: project.id }}
          to={route}
        >
          {preview}
        </Link>
      )}

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        {selectMode ? (
          <button
            className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => onSelectToggle?.()}
            type="button"
          >
            {meta}
          </button>
        ) : (
          <Link
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => onOpen("title")}
            params={{ projectId: project.id }}
            to={route}
          >
            {meta}
          </Link>
        )}

        {selectMode ? null : (actions ?? null)}
      </div>
    </article>
  );
}

export function ProjectCardSkeleton({
  showActions = true,
}: {
  showActions?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="aspect-4/3 bg-muted/30 p-3">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex h-4 items-start">
            <Skeleton className="h-3.5 w-18" />
          </div>
          <div className="flex h-4 items-center gap-2">
            <Skeleton className="h-4 w-11 rounded-sm" />
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
