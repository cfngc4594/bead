import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/bead/components/projects-page";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";

export const Route = createFileRoute("/projects/")({
  component: ProjectsRoute,
  pendingComponent: ProjectsSkeleton,
});

function ProjectsRoute() {
  return <ProjectsPage />;
}
