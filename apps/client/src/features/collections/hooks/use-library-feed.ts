import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { projectsCollection } from "@/features/bead/storage/projects";
import type { LibraryFeedItem } from "@/features/collections/components/library-dnd-grid";
import {
  useGroupedProjectIds,
  useLocalCollections,
} from "@/features/collections/hooks/use-local-collections";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";

export function useLibraryFeed() {
  const groupedProjectIds = useGroupedProjectIds();
  const { data: collections = [] } = useLocalCollections();
  const { data: allProjects = [] } = useLiveQuery(
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
          updatedAt: project.updatedAt,
        })),
    [],
  );

  const projectsById = useMemo(
    () => new Map(allProjects.map((project) => [project.id, project] as const)),
    [allProjects],
  );

  const feedItems = useMemo(() => {
    const items: LibraryFeedItem<
      (typeof allProjects)[number],
      LocalCollection
    >[] = [];

    for (const project of allProjects) {
      if (groupedProjectIds.has(project.id)) {
        continue;
      }

      items.push({
        kind: "project",
        id: project.id,
        project,
      });
    }

    for (const collection of collections) {
      items.push({
        kind: "collection",
        id: collection.id,
        collection,
        projects: collection.projectIds.flatMap((projectId) => {
          const project = projectsById.get(projectId);
          return project ? [project] : [];
        }),
      });
    }

    items.sort((left, right) => {
      const leftAt =
        left.kind === "project"
          ? left.project.updatedAt
          : left.collection.updatedAt;
      const rightAt =
        right.kind === "project"
          ? right.project.updatedAt
          : right.collection.updatedAt;
      return rightAt - leftAt;
    });

    return items;
  }, [allProjects, collections, groupedProjectIds, projectsById]);

  return {
    collections,
    feedItems,
    hasLibrary: allProjects.length > 0 || collections.length > 0,
    projectsById,
  };
}
