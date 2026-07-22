import { Skeleton } from "@bead/ui/components/skeleton";
import { CanvasBoardSkeleton } from "@/features/bead/components/editor-skeleton";

export function PublishedProjectViewerSkeleton() {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Skeleton className="size-7 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="hidden h-5 w-10 rounded-full sm:block" />
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
        <Skeleton className="size-7 rounded-lg sm:hidden" />
        <Skeleton className="size-8 rounded-lg sm:w-[112px]" />
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden bg-muted/30">
        <CanvasBoardSkeleton />
      </section>
    </main>
  );
}
