import { Skeleton } from "@bead/ui/components/skeleton";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";

const projectSkeletons = ["project-1", "project-2", "project-3"];

export function ProjectsSkeleton() {
  return (
    <main className="flex min-h-full bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <div className="flex flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-2 border-b pb-5 md:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-32 rounded-lg sm:w-48 lg:w-56" />
              <Skeleton className="h-8 w-18 rounded-lg" />
            </div>
            <Skeleton className="ml-auto h-8 w-[72px] rounded-lg" />
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectSkeletons.map((project) => (
              <ProjectCardSkeleton key={project} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
