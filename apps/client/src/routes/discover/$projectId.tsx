import { createFileRoute, notFound } from "@tanstack/react-router";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import {
  DiscoverError,
  DiscoverProjectNotFound,
} from "@/features/discover/components/discover-error";
import { DiscoverProjectViewer } from "@/features/discover/components/discover-project-viewer";
import { DiscoverProjectViewerSkeleton } from "@/features/discover/components/discover-project-viewer-skeleton";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/discover/$projectId")({
  loader: async ({ params: { projectId } }) => {
    const project = await queryClient.ensureQueryData(
      discoverProjectQueryOptions(projectId),
    );

    if (!project) {
      throw notFound();
    }

    return project;
  },
  component: DiscoverProjectRoute,
  errorComponent: DiscoverError,
  notFoundComponent: DiscoverProjectNotFound,
  pendingComponent: DiscoverProjectViewerSkeleton,
});

function DiscoverProjectRoute() {
  const project = Route.useLoaderData();
  return <DiscoverProjectViewer project={project} />;
}
