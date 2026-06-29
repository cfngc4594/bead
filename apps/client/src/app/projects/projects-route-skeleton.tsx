"use client";

import { EditorSkeleton } from "@/features/bead/components/editor-skeleton";
import { ProjectsSkeleton } from "@/features/bead/components/projects-skeleton";

export function ProjectsRouteSkeleton() {
  if (typeof window === "undefined") {
    return <main className="min-h-screen bg-background" />;
  }

  const hasProject = new URLSearchParams(window.location.search).has(
    "projectId",
  );

  return hasProject ? <EditorSkeleton /> : <ProjectsSkeleton />;
}
