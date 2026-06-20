import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const projectSkeletons = ["project-1", "project-2", "project-3", "project-4"];

export function BeadProjectsSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-full md:w-24" />
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {projectSkeletons.map((project) => (
            <Card key={project}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="size-14 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
