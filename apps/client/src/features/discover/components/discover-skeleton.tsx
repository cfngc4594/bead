import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Skeleton } from "@bead/ui/components/skeleton";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";

export function DiscoverGridSkeleton() {
  return (
    <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
        <ProjectCardSkeleton showActions={false} />
        <ProjectCardSkeleton showActions={false} />
        <ProjectCardSkeleton showActions={false} />
      </div>
    </ScrollArea>
  );
}

export function DiscoverSkeleton() {
  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl shrink-0 items-center gap-2 border-b px-4 md:px-8">
        <Skeleton className="h-5 w-12" />
      </header>

      <DiscoverGridSkeleton />
    </main>
  );
}
