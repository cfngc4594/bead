import { createFileRoute } from "@tanstack/react-router";
import { CollectionsIndexSkeleton } from "@/features/collections/components/collections-skeleton";
import { DiscoverCollectionsPage } from "@/features/collections/components/discover-collections-page";
import { discoverCollectionsQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverError } from "@/features/discover/components/discover-error";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/discover/collections/")({
  loader: () => queryClient.ensureQueryData(discoverCollectionsQueryOptions),
  component: DiscoverCollectionsPage,
  errorComponent: DiscoverError,
  pendingComponent: CollectionsIndexSkeleton,
});
