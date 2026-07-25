import type { PublishDiscoverProject } from "@bead/core/discover";
import type { Project } from "@/features/bead/storage/projects";

export function createPublishInput(
  project: Pick<Project, "currentIndex" | "sizeId" | "snapshots" | "title">,
): PublishDiscoverProject {
  return {
    title: project.title,
    sizeId: project.sizeId,
    snapshot: project.snapshots[project.currentIndex],
  };
}
