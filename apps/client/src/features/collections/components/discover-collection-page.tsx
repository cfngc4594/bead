import type { DiscoverCollection } from "@bead/core/discover";
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
import { ArrowLeft, FolderOpen, LibraryBig, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/features/bead/components/project-card";
import { importDiscoverCollection } from "@/features/collections/storage/collection-transfer";
import { trackEvent } from "@/lib/analytics";

export function DiscoverCollectionPage({
  collection,
}: {
  collection: DiscoverCollection;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  async function importCollection() {
    if (isImporting) {
      return;
    }

    setIsImporting(true);

    try {
      const localCollection = await importDiscoverCollection(collection);
      trackEvent("collection_added_from_discover", {
        projectCount: collection.projects.length,
      });
      toast.success(`已添加合集和 ${collection.projects.length} 个作品`);
      await navigate({
        to: "/projects/collections/$collectionId",
        params: { collectionId: localCollection.id },
      });
    } catch (error) {
      console.error("Unable to import discover collection", error);
      toast.error("添加合集失败");
      setIsImporting(false);
    }
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回发现合集" to="/discover/collections">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-medium text-sm" title={collection.title}>
            {collection.title}
          </h1>
          <p className="text-muted-foreground text-xs tabular-nums">
            {collection.projects.length} 个作品
          </p>
        </div>
        <Button disabled={isImporting} onClick={() => void importCollection()}>
          {isImporting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LibraryBig />
          )}
          <span className="hidden sm:inline">
            {isImporting ? "正在添加" : "添加到作品"}
          </span>
          <span className="sm:hidden">{isImporting ? "添加中" : "添加"}</span>
        </Button>
      </header>

      <section className="min-h-0 flex-1 overflow-auto scrollbar-gutter-stable px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collection.projects.map((project) => (
              <ProjectCard
                key={project.id}
                onOpen={(source) =>
                  trackEvent("discover_project_opened", {
                    sizeId: project.sizeId,
                    source: `collection_${source}`,
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
        </div>
      </section>
    </main>
  );
}

export function DiscoverCollectionNotFound() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Empty className="flex-1 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>合集不存在</EmptyTitle>
            <EmptyDescription>这个合集可能已被移除。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/discover/collections">
                <ArrowLeft aria-hidden="true" />
                返回发现合集
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
