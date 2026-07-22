import { Skeleton } from "@bead/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { formatRelativeTime } from "@/features/bead/lib/format-relative-time";
import type {
  CanvasSnapshot,
  Project,
} from "@/features/bead/storage/project-schema";

type ProjectCardProject = Pick<
  Project,
  "id" | "title" | "sizeId" | "rows" | "cols"
>;

type ProjectCardRoute = "/discover/$projectId" | "/projects/$projectId";

export function ProjectCard({
  actions,
  openLabel,
  onOpen,
  project,
  route,
  snapshot,
  timestamp,
  timestampLabel,
}: {
  actions?: ReactNode;
  openLabel: string;
  onOpen: (source: "preview" | "title") => void;
  project: ProjectCardProject;
  route: ProjectCardRoute;
  snapshot: CanvasSnapshot;
  timestamp: number;
  timestampLabel: string;
}) {
  const size = getCanvasSize(project.sizeId);

  return (
    <article className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50">
      <Link
        aria-label={`${openLabel} ${project.title}`}
        className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => onOpen("preview")}
        params={{ projectId: project.id }}
        to={route}
      >
        <div className="aspect-4/3">
          <ProjectPreview
            cols={project.cols}
            rows={project.rows}
            snapshot={snapshot}
          />
        </div>
      </Link>

      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        <Link
          className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => onOpen("title")}
          params={{ projectId: project.id }}
          to={route}
        >
          <p className="truncate font-medium text-sm leading-4">
            {project.title}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-muted-foreground text-xs leading-4">
            <span className="flex h-4 shrink-0 items-center rounded-sm bg-muted px-1.5 font-medium text-foreground tabular-nums">
              {size.title}
            </span>
            <time
              className="truncate"
              dateTime={new Date(timestamp).toISOString()}
            >
              {formatRelativeTime(timestamp)}
              {timestampLabel}
            </time>
          </div>
        </Link>

        {actions ?? null}
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
