"use client";

import { BeadEditorSkeleton } from "@/features/bead/components/bead-editor-skeleton";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";

export function ProjectsRouteSkeleton() {
  const hasProject =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("project");

  return hasProject ? <BeadEditorSkeleton /> : <BeadProjectsSkeleton />;
}
