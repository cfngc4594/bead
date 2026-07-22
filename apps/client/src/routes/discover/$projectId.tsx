import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverError } from "@/features/discover/components/discover-error";
import { DiscoverProjectViewer } from "@/features/discover/components/discover-project-viewer";
import { DiscoverProjectViewerSkeleton } from "@/features/discover/components/discover-project-viewer-skeleton";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/discover/$projectId")({
  loader: ({ params: { projectId } }) =>
    queryClient.ensureQueryData(discoverProjectQueryOptions(projectId)),
  component: DiscoverProjectRoute,
  errorComponent: DiscoverError,
  pendingComponent: DiscoverProjectViewerSkeleton,
});

function DiscoverProjectRoute() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(
    discoverProjectQueryOptions(projectId),
  );

  if (!project) {
    return <Navigate replace to="/discover" />;
  }

  return <DiscoverProjectViewer project={project} />;
}
