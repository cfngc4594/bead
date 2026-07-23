import { createFileRoute } from "@tanstack/react-router";
import { CollectionsIndexSkeleton } from "@/features/collections/components/collections-skeleton";
import { LocalCollectionsPage } from "@/features/collections/components/local-collections-page";
import { preloadLocalCollections } from "@/features/collections/storage/collection-commands";

export const Route = createFileRoute("/projects/collections/")({
  loader: preloadLocalCollections,
  component: LocalCollectionsPage,
  pendingComponent: () => <CollectionsIndexSkeleton showCreate />,
});
