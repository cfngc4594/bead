import type { PublishDiscoverProject } from "@bead/api";
import type { Project } from "@/features/bead/storage/projects";

export function createPublishInput(
  project: Pick<
    Project,
    "cols" | "currentIndex" | "rows" | "sizeId" | "snapshots" | "title"
  >,
): PublishDiscoverProject {
  return {
    title: project.title,
    sizeId: project.sizeId,
    rows: project.rows,
    cols: project.cols,
    snapshot: project.snapshots[project.currentIndex],
  };
}
