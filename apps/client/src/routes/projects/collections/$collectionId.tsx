import { createFileRoute, notFound } from "@tanstack/react-router";
import { CollectionDetailSkeleton } from "@/features/collections/components/collections-skeleton";
import {
  LocalCollectionMissing,
  LocalCollectionPage,
} from "@/features/collections/components/local-collection-page";
import { preloadLocalCollections } from "@/features/collections/storage/collection-commands";
import { collectionsCollection } from "@/features/collections/storage/collection-storage";

export const Route = createFileRoute("/projects/collections/$collectionId")({
  loader: async ({ params: { collectionId } }) => {
    await preloadLocalCollections();

    if (!collectionsCollection.has(collectionId)) {
      throw notFound();
    }
  },
  component: LocalCollectionRoute,
  notFoundComponent: LocalCollectionMissing,
  pendingComponent: CollectionDetailSkeleton,
});

function LocalCollectionRoute() {
  const { collectionId } = Route.useParams();
  return <LocalCollectionPage collectionId={collectionId} />;
}
