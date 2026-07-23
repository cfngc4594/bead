import { Button } from "@bead/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bead/ui/components/empty";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Folders } from "lucide-react";
import { CollectionCard } from "@/features/collections/components/collection-card";
import { discoverCollectionsQueryOptions } from "@/features/discover/api/discover-queries";
import { trackEvent } from "@/lib/analytics";

export function DiscoverCollectionsPage() {
  const { data: collections } = useSuspenseQuery(
    discoverCollectionsQueryOptions,
  );

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b px-3 md:px-5">
        <Button asChild size="icon-sm" variant="outline">
          <Link aria-label="返回发现" to="/discover">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-semibold text-base">
          发现合集
        </h1>
      </header>

      <section className="min-h-0 flex-1 overflow-auto scrollbar-gutter-stable px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          {collections.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  collection={collection}
                  key={collection.id}
                  onOpen={(source) =>
                    trackEvent("discover_collection_opened", {
                      projectCount: collection.projects.length,
                      source,
                    })
                  }
                  route="/discover/collections/$collectionId"
                  timestamp={collection.publishedAt}
                  timestampLabel="发布"
                />
              ))}
            </div>
          ) : (
            <Empty className="min-h-72 flex-none border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Folders />
                </EmptyMedia>
                <EmptyTitle>还没有发现合集</EmptyTitle>
                <EmptyDescription>
                  本地合集发布后，会以独立快照出现在这里。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
    </main>
  );
}
