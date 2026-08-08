import { createFileRoute, useRouter } from "@tanstack/react-router";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import {
  DiscoverProjectErrorPage,
  DiscoverProjectPage,
  DiscoverProjectPendingPage,
} from "@/features/discover/components/discover-project-page";

export const Route = createFileRoute("/discover/$projectId")({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(discoverProjectQueryOptions(projectId)),
  pendingComponent: DiscoverProjectPendingPage,
  errorComponent: DiscoverProjectRouteError,
  component: DiscoverProjectPage,
});

function DiscoverProjectRouteError() {
  const router = useRouter();

  return <DiscoverProjectErrorPage onRetry={() => void router.invalidate()} />;
}
