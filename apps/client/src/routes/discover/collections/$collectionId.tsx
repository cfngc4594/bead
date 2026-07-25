import { createFileRoute, notFound } from "@tanstack/react-router";
import { CollectionDetailSkeleton } from "@/features/collections/components/collections-skeleton";
import {
  DiscoverCollectionNotFound,
  DiscoverCollectionPage,
} from "@/features/collections/components/discover-collection-page";
import { discoverCollectionQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverError } from "@/features/discover/components/discover-error";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/discover/collections/$collectionId")({
  loader: async ({ params: { collectionId } }) => {
    const collection = await queryClient.ensureQueryData(
      discoverCollectionQueryOptions(collectionId),
    );

    if (!collection) {
      throw notFound();
    }

    return collection;
  },
  component: DiscoverCollectionRoute,
  errorComponent: DiscoverError,
  notFoundComponent: DiscoverCollectionNotFound,
  pendingComponent: () => <CollectionDetailSkeleton discover />,
});

function DiscoverCollectionRoute() {
  const collection = Route.useLoaderData();
  return <DiscoverCollectionPage collection={collection} />;
}
