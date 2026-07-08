import { Skeleton } from "@bead/ui/components/skeleton";

const projectSkeletons = ["project-1", "project-2", "project-3"];

export function ProjectsSkeleton() {
  return (
    <main className="flex min-h-screen bg-background px-4 py-6 md:px-8">
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
              <article
                className="overflow-hidden rounded-xl border bg-card shadow-xs"
                key={project}
              >
                <div className="aspect-4/3 bg-muted/30 p-3">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>

                <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex h-4 items-start">
                      <Skeleton className="h-3.5 w-18" />
                    </div>
                    <div className="flex h-4 items-center gap-2">
                      <Skeleton className="h-4 w-11 rounded-sm" />
                      <Skeleton className="h-3 w-18" />
                    </div>
                  </div>
                  <Skeleton className="size-7 shrink-0 rounded-md" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
