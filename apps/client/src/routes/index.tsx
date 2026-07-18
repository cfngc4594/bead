import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  preloadProjectsCollection,
  projectsCollection,
} from "@/features/bead/storage/projects";

export const Route = createFileRoute("/")({
  ssr: false,
  loader: preloadProjectsCollection,
  component: HomeRedirect,
});

function HomeRedirect() {
  const { data: projects = [], isReady } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .select(({ project }) => ({ id: project.id })),
    [],
  );

  if (isReady) {
    return (
      <Navigate
        replace
        to={projects.length > 0 ? "/projects" : "/projects/new"}
      />
    );
  }

  return <main className="min-h-full bg-background" />;
}
