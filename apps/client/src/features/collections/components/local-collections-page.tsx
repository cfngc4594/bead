import { DISCOVER_COLLECTION_PREVIEW_LIMIT } from "@bead/core/discover";
import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Folders, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CollectionCard } from "@/features/collections/components/collection-card";
import { LocalCollectionActions } from "@/features/collections/components/local-collection-actions";
import { ProjectSelectionDialog } from "@/features/collections/components/project-selection-dialog";
import { useLocalCollections } from "@/features/collections/hooks/use-local-collections";
import { createLocalCollection } from "@/features/collections/storage/collection-commands";
import { trackEvent } from "@/lib/analytics";

export function LocalCollectionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { data: collections = [] } = useLocalCollections();

  async function createCollection({
    projectIds,
    title,
  }: {
    projectIds: string[];
    title?: string;
  }) {
    const collection = await createLocalCollection({
      projectIds,
      title: title ?? "",
    });
    trackEvent("collection_created", { projectCount: projectIds.length });
    toast.success("合集已创建");
    await navigate({
      to: "/projects/collections/$collectionId",
      params: { collectionId: collection.id },
    });
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b px-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回作品" to="/projects">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-semibold text-base">
          合集
        </h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          新建合集
        </Button>
      </header>

      <section className="min-h-0 flex-1 overflow-auto scrollbar-gutter-stable px-4 py-6 md:px-8">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
          {collections.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  actions={
                    <LocalCollectionActions
                      collection={collection}
                      projects={collection.projects}
                    />
                  }
                  collection={{
                    id: collection.id,
                    title: collection.title,
                    projectCount: collection.projects.length,
                    previewProjects: collection.projects
                      .slice(0, DISCOVER_COLLECTION_PREVIEW_LIMIT)
                      .map((project) => ({
                        id: project.id,
                        sizeId: project.sizeId,
                        snapshot: project.snapshots[project.currentIndex],
                      })),
                  }}
                  key={collection.id}
                  onOpen={(source) =>
                    trackEvent("collection_opened", {
                      projectCount: collection.projects.length,
                      source,
                    })
                  }
                  route="/projects/collections/$collectionId"
                  timestamp={collection.updatedAt}
                  timestampLabel="更新"
                />
              ))}
            </div>
          ) : (
            <Empty className="flex-1 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Folders />
                </EmptyMedia>
                <EmptyTitle>还没有合集</EmptyTitle>
                <EmptyDescription>
                  把相关作品放在一起，之后可以整组发布到发现。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus aria-hidden="true" />
                  新建合集
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </section>

      {isCreateOpen ? (
        <ProjectSelectionDialog
          collectionTitle=""
          description="输入合集名称，并选择一个或多个本地作品。"
          onOpenChange={setIsCreateOpen}
          onSubmit={createCollection}
          open={isCreateOpen}
          submitLabel="创建"
          title="新建合集"
        />
      ) : null}
    </main>
  );
}
