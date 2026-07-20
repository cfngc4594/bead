import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { getCanvasSize } from "@/config/canvas-sizes";
import { Editor } from "@/features/bead/components/editor";
import { EditorSkeleton } from "@/features/bead/components/editor-skeleton";
import {
  preloadProjectsCollection,
  projectsCollection,
} from "@/features/bead/storage/projects";

export const Route = createFileRoute("/projects/$projectId")({
  loader: preloadProjectsCollection,
  component: ProjectEditorRoute,
  pendingComponent: EditorSkeleton,
});

function ProjectEditorRoute() {
  const navigate = Route.useNavigate();
  const { projectId } = Route.useParams();
  const { data: projects, isReady } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .where(({ project }) => eq(project.id, projectId))
        .select(({ project }) => ({
          id: project.id,
          title: project.title,
          sizeId: project.sizeId,
        })),
    [projectId],
  );
  const project = projects?.[0];

  if (isReady && !project) {
    return <Navigate replace to="/projects" />;
  }

  if (!project) {
    return <EditorSkeleton />;
  }

  return (
    <Editor
      projectId={projectId}
      size={getCanvasSize(project.sizeId)}
      title={project.title}
      onBack={() => navigate({ to: "/projects" })}
    />
  );
}
