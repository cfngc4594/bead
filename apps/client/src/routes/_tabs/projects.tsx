import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/bead/components/projects-page";
import { projectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/_tabs/projects")({
  loader: () => projectsCollection.preload(),
  component: ProjectsPage,
});
