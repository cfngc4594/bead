import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Compass, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard } from "@/features/bead/components/project-card";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import { PublishProjectDialog } from "@/features/discover/components/publish-project-dialog";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function DiscoverPage() {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { data: discoverProjects } = useSuspenseQuery(
    discoverProjectsQueryOptions,
  );
  const projects = useMemo(
    () =>
      [...discoverProjects].sort(
        (left, right) => right.publishedAt - left.publishedAt,
      ),
    [discoverProjects],
  );

  return (
    <main
      aria-label="发现"
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">发现</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setIsPublishDialogOpen(true)}>
            <Upload aria-hidden="true" />
            发布
          </Button>
        </div>
      </header>

      {projects.length > 0 ? (
        <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {projects.map((project) => (
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
        </ScrollArea>
      ) : (
        <div
          className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-8"
          id={TAB_CONTENT_ID}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Compass />
              </EmptyMedia>
              <EmptyTitle>暂无内容</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {isPublishDialogOpen ? (
        <PublishProjectDialog
          onOpenChange={setIsPublishDialogOpen}
          open={isPublishDialogOpen}
        />
      ) : null}
    </main>
  );
}
