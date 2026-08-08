import { createFileRoute } from "@tanstack/react-router";
import { NewProjectPage } from "@/features/bead/components/new-project-page";
import { projectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/projects/new")({
  loader: () => projectsCollection.preload(),
  component: NewProjectPage,
});
