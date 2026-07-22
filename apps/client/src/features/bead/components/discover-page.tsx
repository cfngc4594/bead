import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { count, useLiveQuery } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";
import { Compass, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { DiscoverProjectActions } from "@/features/bead/components/discover-project-actions";
import { ProjectCard } from "@/features/bead/components/project-card";
import { PublishProjectDialog } from "@/features/bead/components/publish-project-dialog";
import { projectsCollection } from "@/features/bead/storage/projects";
import { publishedProjectsCollection } from "@/features/bead/storage/published-projects";
import { trackEvent } from "@/lib/analytics";

export function DiscoverPage() {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { data: publishedProjects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: publishedProjectsCollection })
        .orderBy(({ project }) => project.publishedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          sizeId: project.sizeId,
          rows: project.rows,
          cols: project.cols,
          title: project.title,
          snapshot: project.snapshot,
          publishedAt: project.publishedAt,
        })),
    [],
  );
  const { data: localProjectStats } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .select(({ project }) => ({ count: count(project.id) }))
        .findOne(),
    [],
  );
  const hasLocalProjects = (localProjectStats?.count ?? 0) > 0;

  function openPublishDialog() {
    setIsPublishDialogOpen(true);
  }

  return (
    <main
      aria-label="发现"
      className="flex min-h-full bg-background px-4 py-6 md:px-8"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <header className="flex items-end justify-between gap-4 border-b pb-5">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg tracking-tight">发现</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              发布并浏览值得分享的拼豆作品
            </p>
          </div>
          <Button disabled={!hasLocalProjects} onClick={openPublishDialog}>
            <Upload aria-hidden="true" />
            发布作品
          </Button>
        </header>

        {publishedProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedProjects.map((project) => (
              <ProjectCard
                actions={<DiscoverProjectActions project={project} />}
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
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Compass />
              </EmptyMedia>
              <EmptyTitle>
                {hasLocalProjects ? "分享你的第一个作品" : "发现页还空着"}
              </EmptyTitle>
              <EmptyDescription>
                {hasLocalProjects
                  ? "选择已有作品发布到这里，发布后仍可继续编辑原作品。"
                  : "先创作一个拼豆作品，再把它发布到这里。"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasLocalProjects ? (
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
                    to="/projects/new"
                  >
                    <Plus aria-hidden="true" />
                    开始拼豆
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
