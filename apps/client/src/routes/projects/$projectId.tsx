import { createFileRoute } from "@tanstack/react-router";
import { ProjectEditorPage } from "@/features/bead/components/project-editor-page";
import { projectsCollection } from "@/features/bead/storage/projects";

export const Route = createFileRoute("/projects/$projectId")({
  loader: () => projectsCollection.preload(),
  component: ProjectEditorPage,
});
