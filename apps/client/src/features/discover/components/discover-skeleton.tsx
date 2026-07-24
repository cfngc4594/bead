import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Skeleton } from "@bead/ui/components/skeleton";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";
import { CollectionCardSkeleton } from "@/features/collections/components/collection-card";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";

export function DiscoverSkeleton() {
  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-wrap items-center gap-2 border-b px-4 pt-6 pb-5 md:justify-between md:px-8">
        <Skeleton className="h-5 w-12" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-18 rounded-lg" />
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
        <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
          <CollectionCardSkeleton showActions={false} />
          <ProjectCardSkeleton showActions={false} />
          <ProjectCardSkeleton showActions={false} />
        </div>
      </ScrollArea>
    </main>
  );
}
