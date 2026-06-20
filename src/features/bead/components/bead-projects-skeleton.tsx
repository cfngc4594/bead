import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const projectSkeletons = ["project-1", "project-2", "project-3", "project-4"];

export function BeadProjectsSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-28 md:h-9" />
            <Skeleton className="h-5 w-64 max-w-full" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg md:w-[72px]" />
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {projectSkeletons.map((project) => (
            <Card className="h-full" key={project}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <Skeleton className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </div>
                </div>
                <Skeleton className="hidden h-4 w-[72px] shrink-0 md:block" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
