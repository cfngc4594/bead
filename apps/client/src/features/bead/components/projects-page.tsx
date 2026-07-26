import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Grid2x2, Plus } from "lucide-react";
import { ProjectListItem } from "@/features/bead/components/project-list-item";
import { projectsCollection } from "@/features/bead/storage/projects";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function ProjectsPage() {
  const { data: projects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          title: project.title,
          sizeId: project.sizeId,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        })),
    [],
  );

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">作品</h1>
        <div className="ml-auto flex items-center gap-2">
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

      {projects.length > 0 ? (
        <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div
          className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8"
          id={TAB_CONTENT_ID}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Grid2x2 />
              </EmptyMedia>
              <EmptyTitle>暂无作品</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </main>
  );
}
