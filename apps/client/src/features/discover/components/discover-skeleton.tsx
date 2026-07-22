import { Skeleton } from "@bead/ui/components/skeleton";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";

const discoverProjectSkeletons = [
  "discover-project-1",
  "discover-project-2",
  "discover-project-3",
];

export function DiscoverSkeleton() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <header className="flex flex-col items-start gap-4 border-b pb-5 min-[360px]:flex-row min-[360px]:items-end min-[360px]:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discoverProjectSkeletons.map((project) => (
            <ProjectCardSkeleton key={project} showActions={false} />
          ))}
        </div>
      </div>
    </main>
  );
}
