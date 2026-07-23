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
import { Folders, Grid2x2, Plus, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { canvasSizes } from "@/config/canvas-sizes";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectCard } from "@/features/bead/components/project-card";
import { ProjectsToolbar } from "@/features/bead/components/projects-toolbar";
import { projectsCollection } from "@/features/bead/storage/projects";
import { trackEvent } from "@/lib/analytics";

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
        <div className="flex flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
            {hasProjects ? (
              <ProjectsToolbar
                onSizeFilterChange={handleSizeFilterChange}
                sizeFilter={selectedSizes}
                sizeOptions={sizeOptions}
                titleFilter={titleFilter}
                onTitleFilterChange={handleTitleFilterChange}
              />
            ) : (
              <h1 className="font-semibold text-lg tracking-tight">作品</h1>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/projects/collections">
                  <Folders aria-hidden="true" />
                  <span className="hidden sm:inline">合集</span>
                </Link>
              </Button>
              <Button asChild>
                <Link
                  onClick={() => trackEvent("project_new_clicked")}
                  to="/projects/new"
                >
                  <Plus aria-hidden="true" />
                  新建
                </Link>
              </Button>
            </div>
          </header>

          {hasProjects ? (
            projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    actions={<ProjectActions project={project} />}
                    key={project.id}
                    onOpen={(source) =>
                      trackEvent("project_opened", {
                        sizeId: project.sizeId,
                        source,
                      })
                    }
                    openLabel="打开"
                    project={project}
                    route="/projects/$projectId"
                    snapshot={project.snapshots[project.currentIndex]}
                    timestamp={project.updatedAt}
                    timestampLabel="更新"
                  />
                ))}
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
            )
          ) : (
            <Empty className="min-h-72 flex-none border">
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
      </div>
    </main>
  );
}
