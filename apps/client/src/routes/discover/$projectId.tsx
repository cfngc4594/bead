import { createFileRoute } from "@tanstack/react-router";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverProjectPage } from "@/features/discover/components/discover-project-page";

export const Route = createFileRoute("/discover/$projectId")({
  loader: ({ context: { queryClient }, params: { projectId } }) => {
    void queryClient.prefetchQuery(discoverProjectQueryOptions(projectId));
  },
  component: DiscoverProjectPage,
});
