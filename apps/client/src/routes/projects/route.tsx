import { createFileRoute, Outlet } from "@tanstack/react-router";
import { preloadProjectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/projects")({
  ssr: false,
  loader: preloadProjectsCollection,
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
