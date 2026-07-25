import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/bead/components/projects-page";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";
import { preloadProjectsCollection } from "@/features/bead/storage/projects";
import { preloadLocalCollections } from "@/features/collections/storage/collection-commands";

export const Route = createFileRoute("/_tabs/projects")({
  loader: () =>
    Promise.all([preloadProjectsCollection(), preloadLocalCollections()]),
  component: ProjectsPage,
  pendingComponent: ProjectsSkeleton,
});
