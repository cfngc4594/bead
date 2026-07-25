import { useLiveQuery } from "@tanstack/react-db";
import {
  type Project,
  projectsCollection,
} from "@/features/bead/storage/projects";

export type ProjectChoice = Pick<
  Project,
  "currentIndex" | "id" | "sizeId" | "snapshots" | "title"
>;

export function useProjectChoices() {
  return useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .orderBy(({ project }) => project.updatedAt, "desc")
        .select(({ project }) => ({
          id: project.id,
          sizeId: project.sizeId,
          title: project.title,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
        })),
    [],
  );
}
