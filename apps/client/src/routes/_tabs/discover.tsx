import { createFileRoute } from "@tanstack/react-router";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverListPage } from "@/features/discover/components/discover-list-page";

export const Route = createFileRoute("/_tabs/discover")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(discoverProjectsQueryOptions);
  },
  component: DiscoverListPage,
});
