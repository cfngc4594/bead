import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { PublishedProjectViewer } from "@/features/bead/components/published-project-viewer";
import { PublishedProjectViewerSkeleton } from "@/features/bead/components/published-project-viewer-skeleton";
import {
  preloadProjectSharingCollections,
  publishedProjectsCollection,
} from "@/features/bead/storage/published-projects";

export const Route = createFileRoute("/discover/$projectId")({
  loader: preloadProjectSharingCollections,
  component: PublishedProjectRoute,
  pendingComponent: PublishedProjectViewerSkeleton,
});

function PublishedProjectRoute() {
  const { projectId } = Route.useParams();
  const { data: project, isReady } = useLiveQuery(
    (query) =>
      query
        .from({ project: publishedProjectsCollection })
        .where(({ project }) => eq(project.id, projectId))
        .select(({ project }) => ({
          id: project.id,
          sizeId: project.sizeId,
          rows: project.rows,
          cols: project.cols,
          title: project.title,
          snapshot: project.snapshot,
          sourceUpdatedAt: project.sourceUpdatedAt,
          publishedAt: project.publishedAt,
        }))
        .findOne(),
    [projectId],
  );

  if (isReady && !project) {
    return <Navigate replace to="/discover" />;
  }

  if (!project) {
    return <PublishedProjectViewerSkeleton />;
  }

  return <PublishedProjectViewer project={project} />;
}
