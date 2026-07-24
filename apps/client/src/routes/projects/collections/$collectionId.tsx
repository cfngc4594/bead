import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  preloadProjectsCollection,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { CollectionDetailSkeleton } from "@/features/collections/components/collections-skeleton";
import {
  LocalCollectionNotFound,
  LocalCollectionPage,
} from "@/features/collections/components/local-collection-page";
import { preloadLocalCollections } from "@/features/collections/storage/collection-commands";
import { collectionsCollection } from "@/features/collections/storage/collection-storage";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/projects/collections/$collectionId")({
  loader: async ({ params: { collectionId } }) => {
    await Promise.all([
      preloadProjectsCollection(),
      preloadLocalCollections(),
    ]);

    if (!collectionsCollection.has(collectionId)) {
      throw notFound();
    }

    return { collectionId };
  },
  component: LocalCollectionRoute,
  notFoundComponent: LocalCollectionNotFound,
  pendingComponent: () => <CollectionDetailSkeleton />,
});

function LocalCollectionRoute() {
  const { collectionId } = Route.useParams();
  const { data: allProjects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .select(({ project }) => ({
          id: project.id,
          title: project.title,
          sizeId: project.sizeId,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        })),
    [],
  );
  const projectsById = useMemo(
    () => new Map(allProjects.map((project) => [project.id, project] as const)),
    [allProjects],
  );

  useEffect(() => {
    trackEvent("collection_opened", {
      source: "page",
    });
  }, []);

  return (
    <LocalCollectionPage
      collectionId={collectionId}
      projectsById={projectsById}
    />
  );
}
