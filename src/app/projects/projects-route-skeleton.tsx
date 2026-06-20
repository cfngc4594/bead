"use client";

import { BeadEditorSkeleton } from "@/features/bead/components/bead-editor-skeleton";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";

export function ProjectsRouteSkeleton() {
  if (typeof window === "undefined") {
    return <main className="min-h-screen bg-background" />;
  }

  const hasProject = new URLSearchParams(window.location.search).has("project");

  return hasProject ? <BeadEditorSkeleton /> : <BeadProjectsSkeleton />;
}
