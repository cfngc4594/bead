import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/bead/components/projects-page";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";
import { preloadProjectSharingCollections } from "@/features/bead/storage/published-projects";

export const Route = createFileRoute("/_tabs/projects")({
  loader: preloadProjectSharingCollections,
  component: ProjectsPage,
  pendingComponent: ProjectsSkeleton,
});
