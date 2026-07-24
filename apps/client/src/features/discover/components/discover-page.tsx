import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { useLiveQuery } from "@tanstack/react-db";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Compass, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard } from "@/features/bead/components/project-card";
import {
  getFilledCount,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { CollectionCard } from "@/features/collections/components/collection-card";
import {
  discoverCollectionsQueryOptions,
  discoverProjectsQueryOptions,
} from "@/features/discover/api/discover-queries";
import { PublishProjectDialog } from "@/features/discover/components/publish-project-dialog";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";
import { trackEvent } from "@/lib/analytics";

export function DiscoverPage() {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { data: discoverProjects } = useSuspenseQuery(
    discoverProjectsQueryOptions,
  );
  const { data: discoverCollections } = useSuspenseQuery(
    discoverCollectionsQueryOptions,
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
  const feedItems = useMemo(() => {
    const items: Array<
      | {
          kind: "project";
          publishedAt: number;
          project: (typeof discoverProjects)[number];
        }
      | {
          kind: "collection";
          publishedAt: number;
          collection: (typeof discoverCollections)[number];
        }
    > = [
      ...discoverProjects.map((project) => ({
        kind: "project" as const,
        publishedAt: project.publishedAt,
        project,
      })),
      ...discoverCollections.map((collection) => ({
        kind: "collection" as const,
        publishedAt: collection.publishedAt,
        collection,
      })),
    ];

    items.sort((left, right) => right.publishedAt - left.publishedAt);
    return items;
  }, [discoverCollections, discoverProjects]);

  function openPublishDialog() {
    setIsPublishDialogOpen(true);
  }

  return (
    <main
      aria-label="发现"
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-wrap items-center gap-2 border-b px-4 pt-6 pb-5 md:justify-between md:px-8">
        <h1 className="font-semibold text-lg tracking-tight">发现</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={openPublishDialog}>
            <Upload aria-hidden="true" />
            发布
          </Button>
        </div>
      </header>

      {feedItems.length > 0 ? (
        <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
            {feedItems.map((item) =>
              item.kind === "project" ? (
                <ProjectCard
                  key={`project:${item.project.id}`}
                  onOpen={(source) =>
                    trackEvent("discover_project_opened", {
                      sizeId: item.project.sizeId,
                      source,
                    })
                  }
                  openLabel="查看"
                  project={item.project}
                  route="/discover/$projectId"
                  snapshot={item.project.snapshot}
                  timestamp={item.project.publishedAt}
                  timestampLabel="发布"
                />
              ) : (
                <CollectionCard
                  key={`collection:${item.collection.id}`}
                  onOpen={(source) =>
                    trackEvent("discover_collection_opened", {
                      projectCount: item.collection.projectCount,
                      source,
                    })
                  }
                  collection={item.collection}
                  route="/discover/collections/$collectionId"
                  timestamp={item.collection.publishedAt}
                  timestampLabel="发布"
                />
              ),
            )}
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
