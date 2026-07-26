import { createFileRoute } from "@tanstack/react-router";
import { NewProjectPage } from "@/features/bead/components/new-project-page";

export const Route = createFileRoute("/projects/new")({
  component: NewProjectPage,
});
