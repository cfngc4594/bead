import { ScrollArea } from "@bead/ui/components/scroll-area";
import { ProjectCardSkeleton } from "@/features/bead/components/project-card";
import { TAB_CONTENT_ID } from "@/features/navigation/tab-config";

export function DiscoverListSkeleton() {
  return (
    <ScrollArea className="min-h-0 flex-1" id={TAB_CONTENT_ID}>
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
        <ProjectCardSkeleton showActions={false} />
        <ProjectCardSkeleton showActions={false} />
        <ProjectCardSkeleton showActions={false} />
      </div>
    </ScrollArea>
  );
}
