"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getCanvasSize } from "@/config/canvas-sizes";
import { EditorSkeleton } from "@/features/bead/components/editor-skeleton";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";
import { projectsCollection } from "@/features/bead/storage/projects";

const ProjectsPage = dynamic(
  () =>
    import("@/features/bead/components/projects-page").then(
      (module) => module.ProjectsPage,
    ),
  {
    loading: () => <ProjectsSkeleton />,
    ssr: false,
  },
);

const Editor = dynamic(
  () =>
    import("@/features/bead/components/editor").then((module) => module.Editor),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  },
);

export function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { data: projects, isReady } = useLiveQuery(
    (query) =>
      projectId
        ? query
            .from({ project: projectsCollection })
            .where(({ project }) => eq(project.id, projectId))
            .select(({ project }) => ({
              id: project.id,
              title: project.title,
              sizeId: project.sizeId,
            }))
        : undefined,
    [projectId],
  );
  const project = projects?.[0];

  useEffect(() => {
    if (projectId && isReady && !project) {
      router.replace("/projects");
    }
  }, [project, isReady, projectId, router]);

  if (!projectId) {
    return <ProjectsPage />;
  }

  if (!project) {
    return <EditorSkeleton />;
  }

  return (
    <Editor
      projectId={projectId}
      size={getCanvasSize(project.sizeId)}
      title={project.title}
    />
  );
}
