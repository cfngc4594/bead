import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/bead/components/projects-page";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";
import { preloadProjectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/_tabs/projects")({
  loader: preloadProjectsCollection,
  component: ProjectsPage,
  pendingComponent: ProjectsSkeleton,
});
