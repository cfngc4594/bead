import { createFileRoute, useRouter } from "@tanstack/react-router";
import { discoverProjectsQueryOptions } from "@/features/discover/api/discover-queries";
import {
  DiscoverListErrorPage,
  DiscoverListPage,
  DiscoverListPendingPage,
} from "@/features/discover/components/discover-list-page";

export const Route = createFileRoute("/_tabs/discover")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(discoverProjectsQueryOptions),
  pendingComponent: DiscoverListPendingPage,
  errorComponent: DiscoverListRouteError,
  component: DiscoverListPage,
});

function DiscoverListRouteError() {
  const router = useRouter();

  return <DiscoverListErrorPage onRetry={() => void router.invalidate()} />;
}
