import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { ProjectCard } from "@/features/bead/components/project-card";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverContentError } from "@/features/discover/components/discover-error";
import { DiscoverGridSkeleton } from "@/features/discover/components/discover-skeleton";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function DiscoverPage() {
  return (
    <main
      aria-label="发现"
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">发现</h1>
      </header>

      <DiscoverProjectGrid />
    </main>
  );
}

function DiscoverProjectGrid() {
  const {
    data: projects,
    isPending,
    isError,
    refetch,
  } = useQuery(discoverProjectsQueryOptions);

  if (isPending) {
    return <DiscoverGridSkeleton />;
  }

  if (isError) {
    return <DiscoverContentError onRetry={() => void refetch()} />;
  }

  if (projects.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}
