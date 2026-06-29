"use client";

import { useLiveQuery } from "@tanstack/react-db";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Grid2x2, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { canvasSizes, getCanvasSize } from "@/config/canvas-sizes";
import { ProjectActions } from "@/features/bead/components/project-actions";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import { ProjectsToolbar } from "@/features/bead/components/projects-toolbar";
import {
  type Project,
  projectsCollection,
} from "@/features/bead/storage/projects";

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

const columns: ColumnDef<ProjectListItem>[] = [
  {
    accessorKey: "title",
  },
  {
    accessorKey: "sizeId",
    enableGlobalFilter: false,
    filterFn: (row, columnId, filterValue) => {
      const selected = Array.isArray(filterValue) ? filterValue : [];

      return selected.length === 0 || selected.includes(row.getValue(columnId));
    },
  },
  {
    accessorKey: "updatedAt",
    enableGlobalFilter: false,
  },
];

const sorting: SortingState = [{ id: "updatedAt", desc: true }];
const sizeColumnId = "sizeId";

export function ProjectsPage() {
  const [titleFilter, setTitleFilter] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const { data: projects = [] } = useLiveQuery((query) =>
    query.from({ project: projectsCollection }).select(({ project }) => ({
      id: project.id,
      sizeId: project.sizeId,
      rows: project.rows,
      cols: project.cols,
      title: project.title,
      snapshots: project.snapshots,
      currentIndex: project.currentIndex,
      updatedAt: project.updatedAt,
    })),
  );
  const sizeOptions = useMemo(
    () =>
      canvasSizes.map((size) => ({
        label: size.title,
        value: size.id,
        count: projects.filter((project) => project.sizeId === size.id).length,
      })),
    [projects],
  );
  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      selectedSizes.length > 0
        ? [{ id: sizeColumnId, value: selectedSizes }]
        : [],
    [selectedSizes],
  );
  const table = useReactTable({
    data: projects,
    columns,
    state: {
      columnFilters,
      globalFilter: titleFilter,
      sorting,
    },
    onGlobalFilterChange: setTitleFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;
  const hasProjects = projects.length > 0;

  return (
    <main className="flex min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        {hasProjects ? (
          <div className="flex flex-1 flex-col gap-4">
            <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
              <ProjectsToolbar
                onSizeFilterChange={setSelectedSizes}
                sizeFilter={selectedSizes}
                sizeOptions={sizeOptions}
                titleFilter={titleFilter}
                onTitleFilterChange={setTitleFilter}
              />
              <Button asChild className="ml-auto">
                <Link href="/projects/new">
                  <Plus aria-hidden="true" />
                  新建
                </Link>
              </Button>
            </header>

            {rows.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((row) => {
                  const project = row.original;
                  const size = getCanvasSize(project.sizeId);

                  return (
                    <article
                      className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50"
                      key={project.id}
                    >
                      <Link
                        aria-label={`打开 ${project.title}`}
                        className="block bg-muted/30 outline-none transition-colors group-hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                        href={`/projects?projectId=${project.id}`}
                      >
                        <div className="aspect-4/3">
                          <ProjectPreview project={project} />
                        </div>
                      </Link>

                      <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
                        <Link
                          className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          href={`/projects?projectId=${project.id}`}
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
                    onClick={() => {
                      setTitleFilter("");
                      setSelectedSizes([]);
                    }}
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
                <Link href="/projects/new">
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
