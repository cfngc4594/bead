import { ScrollArea } from "@bead/ui/components/scroll-area";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";

export function ProjectsGridSkeleton() {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 px-4 py-6 md:px-8 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </ScrollArea>
  );
}
