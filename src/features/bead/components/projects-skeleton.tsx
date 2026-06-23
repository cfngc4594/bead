import { Skeleton } from "@/components/ui/skeleton";

const projectSkeletons = ["project-1", "project-2", "project-3"];

export function ProjectsSkeleton() {
  return (
    <main className="flex min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <Skeleton className="h-8 w-28 md:h-9" />
          <Skeleton className="h-8 w-[72px] rounded-lg" />
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

              <div className="flex items-center gap-3 border-t bg-card p-4">
                <Skeleton className="size-9 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="size-7 shrink-0 rounded-md" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
