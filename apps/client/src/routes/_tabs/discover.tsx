import { createFileRoute } from "@tanstack/react-router";
import { preloadProjectsCollection } from "@/features/bead/storage/projects";
import {
  discoverCollectionsQueryOptions,
  discoverProjectsQueryOptions,
} from "@/features/discover/api/discover-queries";
import { DiscoverError } from "@/features/discover/components/discover-error";
import { DiscoverPage } from "@/features/discover/components/discover-page";
import { DiscoverSkeleton } from "@/features/discover/components/discover-skeleton";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/_tabs/discover")({
  loader: () =>
    Promise.all([
      preloadProjectsCollection(),
      queryClient.ensureQueryData(discoverProjectsQueryOptions),
      queryClient.ensureQueryData(discoverCollectionsQueryOptions),
    ]),
  component: DiscoverPage,
  errorComponent: DiscoverError,
  pendingComponent: DiscoverSkeleton,
});
