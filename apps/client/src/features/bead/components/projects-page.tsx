import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { count, ilike, inArray, useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Grid2x2, Plus, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { canvasSizes, getCanvasSize } from "@/config/canvas-sizes";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { ProjectsToolbar } from "@/features/bead/components/projects-toolbar";
import {
  type Project,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { trackEvent } from "@/lib/analytics";

type ProjectListItem = Pick<
  Project,
  | "id"
  | "sizeId"
  | "rows"
  | "cols"
  | "title"
  | "snapshots"
  | "currentIndex"
  | "updatedAt"
>;

export function ProjectsPage() {
  const [titleFilter, setTitleFilter] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const hasTrackedTitleFilterRef = useRef(false);
  const normalizedTitleFilter = titleFilter.trim();
  const { data: projects = [] } = useLiveQuery(
    (query) => {
      let projectQuery = query.from({ project: projectsCollection });

      if (normalizedTitleFilter.length > 0) {
        projectQuery = projectQuery.where(({ project }) =>
          ilike(project.title, `%${normalizedTitleFilter}%`),
        );
      }

      if (selectedSizes.length > 0) {
        projectQuery = projectQuery.where(({ project }) =>
          inArray(project.sizeId, selectedSizes),
        );
      }

      return projectQuery
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          sizeId: project.sizeId,
          rows: project.rows,
          cols: project.cols,
          title: project.title,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        }));
    },
    [normalizedTitleFilter, selectedSizes],
  );
  const { data: sizeCounts = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .groupBy(({ project }) => project.sizeId)
        .select(({ project }) => ({
          sizeId: project.sizeId,
          count: count(project.id),
        })),
    [],
  );
  const totalProjectCount = sizeCounts.reduce(
    (total, size) => total + size.count,
    0,
  );
  const sizeOptions = useMemo(() => {
    const countsBySize = new Map(
      sizeCounts.map((size) => [size.sizeId, size.count]),
    );

    return canvasSizes.map((size) => ({
      label: size.title,
      value: size.id,
      count: countsBySize.get(size.id) ?? 0,
    }));
  }, [sizeCounts]);
  const hasProjects = totalProjectCount > 0;

  function handleTitleFilterChange(nextTitleFilter: string) {
    if (
      nextTitleFilter.trim().length > 0 &&
      !hasTrackedTitleFilterRef.current
    ) {
      trackEvent("project_filter_used", {
        filterType: "title",
      });
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
      hadTitleFilter: normalizedTitleFilter.length > 0,
      sizeFilterCount: selectedSizes.length,
    });
    setTitleFilter("");
    setSelectedSizes([]);
    hasTrackedTitleFilterRef.current = false;
  }

  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        {hasProjects ? (
          <div className="flex flex-1 flex-col gap-4">
            <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
              <ProjectsToolbar
                onSizeFilterChange={handleSizeFilterChange}
                sizeFilter={selectedSizes}
                sizeOptions={sizeOptions}
                titleFilter={titleFilter}
                onTitleFilterChange={handleTitleFilterChange}
              />
              <Button asChild className="ml-auto">
                <Link
                  onClick={() => trackEvent("project_new_clicked")}
                  to="/projects/new"
                >
                  <Plus aria-hidden="true" />
                  新建
                </Link>
              </Button>
            </header>

            {projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: ProjectListItem) => {
                  const size = getCanvasSize(project.sizeId);

                  return (
                    <article
                      className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50"
                      key={project.id}
                    >
                      <Link
                        aria-label={`打开 ${project.title}`}
                        className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                        onClick={() =>
                          trackEvent("project_opened", {
                            sizeId: project.sizeId,
                            source: "preview",
                          })
                        }
                        params={{ projectId: project.id }}
                        to="/projects/$projectId"
                      >
                        <div className="aspect-4/3">
                          <ProjectPreview project={project} />
                        </div>
                      </Link>

                      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
                        <Link
                          className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          onClick={() =>
                            trackEvent("project_opened", {
                              sizeId: project.sizeId,
                              source: "title",
                            })
                          }
                          params={{ projectId: project.id }}
                          to="/projects/$projectId"
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
                              dateTime={new Date(
                                project.updatedAt,
                              ).toISOString()}
                            >
                              {formatUpdatedAt(project.updatedAt)}更新
                            </time>
                          </div>
                        </Link>

                        <ProjectActions project={project} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>没有匹配的作品</EmptyTitle>
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
            )}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Grid2x2 />
              </EmptyMedia>
              <EmptyTitle>还没有拼豆作品</EmptyTitle>
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
    </main>
  );
}

function formatUpdatedAt(updatedAt: number) {
  const elapsedSeconds = Math.max(
    1,
    Math.floor((Date.now() - updatedAt) / 1000),
  );
  const units = [
    { label: "年", seconds: 60 * 60 * 24 * 365 },
    { label: "个月", seconds: 60 * 60 * 24 * 30 },
    { label: "天", seconds: 60 * 60 * 24 },
    { label: "小时", seconds: 60 * 60 },
    { label: "分钟", seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(elapsedSeconds / unit.seconds);

    if (value >= 1) {
      return `${value} ${unit.label}前`;
    }
  }

  return "刚刚";
}
