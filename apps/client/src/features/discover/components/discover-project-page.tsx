import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Suspense } from "react";
import { discoverProjectQueryOptions } from "@/features/discover/api/discover-queries";
import { DiscoverProjectHeaderSkeleton } from "@/features/discover/components/discover-project-page-skeleton";
import {
  DiscoverProjectBackButton,
  DiscoverProjectShell,
} from "@/features/discover/components/discover-project-shell";
import { DiscoverProjectViewer } from "@/features/discover/components/discover-project-viewer";
import {
  DiscoverProjectError,
  DiscoverProjectNotFoundPanel,
  DiscoverProjectNotFoundTitle,
} from "@/features/discover/components/discover-states";

const routeApi = getRouteApi("/discover/$projectId");

export function DiscoverProjectPage() {
  return (
    <Suspense fallback={<DiscoverProjectPendingPage />}>
      <DiscoverProjectContent />
    </Suspense>
  );
}

export function DiscoverProjectPendingPage() {
  return (
    <DiscoverProjectShell
      header={
        <>
          <DiscoverProjectBackButton />
          <DiscoverProjectHeaderSkeleton />
        </>
      }
    />
  );
}

export function DiscoverProjectErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <DiscoverProjectShell header={<DiscoverProjectBackButton />}>
      <DiscoverProjectError onRetry={onRetry} />
    </DiscoverProjectShell>
  );
}

function DiscoverProjectContent() {
  const { projectId } = routeApi.useParams();
  const { data: project } = useSuspenseQuery(
    discoverProjectQueryOptions(projectId),
  );

  if (!project) {
    return (
      <DiscoverProjectShell
        header={
          <>
            <DiscoverProjectBackButton />
            <DiscoverProjectNotFoundTitle />
          </>
        }
      >
        <DiscoverProjectNotFoundPanel />
      </DiscoverProjectShell>
    );
  }

  return <DiscoverProjectViewer project={project} />;
}
