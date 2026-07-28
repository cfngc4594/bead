import { Skeleton } from "@bead/ui/components/skeleton";

export function DiscoverProjectHeaderSkeleton() {
  return (
    <>
      <Skeleton className="size-7 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="hidden h-5 w-10 rounded-full sm:block" />
      </div>
      <Skeleton className="size-7 shrink-0 rounded-lg" />
      <Skeleton className="h-8 w-16 shrink-0 rounded-lg sm:w-28" />
    </>
  );
}
