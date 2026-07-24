import { Skeleton } from "@bead/ui/components/skeleton";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";

const skeletonItems = ["collection-1", "collection-2", "collection-3"];

export function CollectionDetailSkeleton({
  discover = false,
}: {
  discover?: boolean;
}) {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-5">
        <Skeleton className="size-7 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-14" />
        </div>
        {discover ? (
          <Skeleton className="h-8 w-16 rounded-lg sm:w-24" />
        ) : (
          <>
            <Skeleton className="h-8 w-16 rounded-lg sm:w-24" />
            <Skeleton className="size-7 rounded-lg" />
          </>
        )}
      </header>
      <section className="min-h-0 flex-1 overflow-hidden px-4 py-6 md:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonItems.map((item) => (
            <ProjectCardSkeleton key={item} showActions={!discover} />
          ))}
        </div>
      </section>
    </main>
  );
}
