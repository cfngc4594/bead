import { createFileRoute } from "@tanstack/react-router";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverError } from "@/features/discover/components/discover-error";
import { DiscoverPage } from "@/features/discover/components/discover-page";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/_tabs/discover")({
  loader: () => {
    void queryClient.prefetchQuery(discoverProjectsQueryOptions);
  },
  component: DiscoverPage,
  errorComponent: DiscoverError,
});
