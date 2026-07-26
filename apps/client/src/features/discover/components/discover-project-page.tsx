import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import {
  DiscoverProjectCanvasSkeleton,
  DiscoverProjectHeaderSkeleton,
} from "@/features/discover/components/discover-project-page-skeleton";
import { DiscoverProjectShell } from "@/features/discover/components/discover-project-shell";
import { DiscoverProjectViewer } from "@/features/discover/components/discover-project-viewer";
import {
  DiscoverProjectError,
  DiscoverProjectNotFoundPanel,
  DiscoverProjectNotFoundTitle,
} from "@/features/discover/components/discover-states";

const routeApi = getRouteApi("/discover/$projectId");

export function DiscoverProjectPage() {
  const { projectId } = routeApi.useParams();
  const {
    data: project,
    isPending,
    isError,
    refetch,
  } = useQuery(discoverProjectQueryOptions(projectId));

  if (isPending) {
    return (
      <DiscoverProjectShell header={<DiscoverProjectHeaderSkeleton />}>
        <DiscoverProjectCanvasSkeleton />
      </DiscoverProjectShell>
    );
  }

  if (isError) {
    return (
      <DiscoverProjectShell header={null}>
        <DiscoverProjectError onRetry={() => void refetch()} />
      </DiscoverProjectShell>
    );
  }

  if (!project) {
    return (
      <DiscoverProjectShell header={<DiscoverProjectNotFoundTitle />}>
        <DiscoverProjectNotFoundPanel />
      </DiscoverProjectShell>
    );
  }

  return <DiscoverProjectViewer project={project} />;
}
