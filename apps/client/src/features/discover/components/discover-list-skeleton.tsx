import { ProjectCardSkeleton } from "@/features/bead/components/project-card";

export function DiscoverListSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
      <ProjectCardSkeleton showActions={false} />
      <ProjectCardSkeleton showActions={false} />
      <ProjectCardSkeleton showActions={false} />
    </div>
  );
}
