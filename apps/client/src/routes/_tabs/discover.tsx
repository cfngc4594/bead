import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "@/features/bead/components/discover-page";
import { DiscoverSkeleton } from "@/features/bead/components/discover-skeleton";
import { preloadProjectSharingCollections } from "@/features/bead/storage/published-projects";

export const Route = createFileRoute("/_tabs/discover")({
  loader: preloadProjectSharingCollections,
  component: DiscoverPage,
  pendingComponent: DiscoverSkeleton,
});
