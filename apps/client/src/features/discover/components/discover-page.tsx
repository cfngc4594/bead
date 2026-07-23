import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { useLiveQuery } from "@tanstack/react-db";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Compass, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { ProjectCard } from "@/features/bead/components/project-card";
import {
  getFilledCount,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import { PublishProjectDialog } from "@/features/discover/components/publish-project-dialog";
import { trackEvent } from "@/lib/analytics";

export function DiscoverPage() {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { data: discoverProjects } = useSuspenseQuery(
    discoverProjectsQueryOptions,
  );
  const { data: localProjects = [] } = useLiveQuery(
    (query) =>
      query.from({ project: projectsCollection }).select(({ project }) => ({
        snapshots: project.snapshots,
        currentIndex: project.currentIndex,
      })),
    [],
  );
  const hasLocalProjects = localProjects.length > 0;
  const hasPublishableProjects = localProjects.some(
    (project) => getFilledCount(project) > 0,
  );

  function openPublishDialog() {
    setIsPublishDialogOpen(true);
  }

  return (
    <main
      aria-label="发现"
      className="flex min-h-full bg-background px-4 py-6 md:px-8"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
          <h1 className="font-semibold text-lg tracking-tight">发现</h1>
          <Button className="ml-auto" onClick={openPublishDialog}>
            <Upload aria-hidden="true" />
            发布作品
          </Button>
        </header>

        {discoverProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverProjects.map((project) => (
              <ProjectCard
                key={project.id}
                onOpen={(source) =>
                  trackEvent("discover_project_opened", {
                    sizeId: project.sizeId,
                    source,
                  })
                }
                openLabel="查看"
                project={project}
                route="/discover/$projectId"
                snapshot={project.snapshot}
                timestamp={project.publishedAt}
                timestampLabel="发布"
              />
            ))}
          </div>
        ) : (
          <Empty className="min-h-72 flex-none border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Compass />
              </EmptyMedia>
              <EmptyTitle>
                {hasPublishableProjects ? "分享你的第一个作品" : "发现页还空着"}
              </EmptyTitle>
              <EmptyDescription>
                {hasPublishableProjects
                  ? "选择一个本地作品，将当前快照发布到这里。"
                  : hasLocalProjects
                    ? "完成一个拼豆作品后，就可以把它发布到这里。"
                    : "先创作一个拼豆作品，再把它发布到这里。"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasPublishableProjects ? (
                <Button onClick={openPublishDialog}>
                  <Upload aria-hidden="true" />
                  选择作品
                </Button>
              ) : (
                <Button asChild>
                  <Link
                    onClick={() =>
                      trackEvent("project_new_clicked", {
                        source: "discover_empty",
                      })
                    }
                    to={hasLocalProjects ? "/projects" : "/projects/new"}
                  >
                    <Plus aria-hidden="true" />
                    {hasLocalProjects ? "继续创作" : "开始拼豆"}
                  </Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        )}
      </div>

      {isPublishDialogOpen ? (
        <PublishProjectDialog
          onOpenChange={setIsPublishDialogOpen}
          open={isPublishDialogOpen}
        />
      ) : null}
    </main>
  );
}
