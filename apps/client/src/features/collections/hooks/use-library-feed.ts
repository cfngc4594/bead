import { count, useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { canvasSizes } from "@/config/canvas-sizes";
import { projectsCollection } from "@/features/bead/storage/projects";
import type { LibraryFeedItem } from "@/features/collections/components/library-dnd-grid";
import {
  useGroupedProjectIds,
  useLocalCollections,
} from "@/features/collections/hooks/use-local-collections";
import type { LocalCollection } from "@/features/collections/storage/collection-storage";

export function useLibraryFeed({
  selectedSizes,
  titleFilter,
}: {
  selectedSizes: string[];
  titleFilter: string;
}) {
  const normalizedTitle = titleFilter.trim().toLowerCase();
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
  const { data: sizeCounts = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .groupBy(({ project }) => project.sizeId)
        .select(({ project }) => ({
          sizeId: project.sizeId,
          count: count(project.id),
        })),
    [],
  );

  const totalProjectCount = sizeCounts.reduce(
    (total, size) => total + size.count,
    0,
  );
  const sizeOptions = useMemo(() => {
    const countsBySize = new Map(
      sizeCounts.map((size) => [size.sizeId, size.count]),
    );

    return canvasSizes.map((size) => ({
      label: size.title,
      value: size.id,
      count: countsBySize.get(size.id) ?? 0,
    }));
  }, [sizeCounts]);

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

      if (
        normalizedTitle.length > 0 &&
        !project.title.toLowerCase().includes(normalizedTitle)
      ) {
        continue;
      }

      if (selectedSizes.length > 0 && !selectedSizes.includes(project.sizeId)) {
        continue;
      }

      items.push({
        kind: "project",
        id: project.id,
        project,
      });
    }

    if (selectedSizes.length === 0) {
      for (const collection of collections) {
        if (
          normalizedTitle.length > 0 &&
          !collection.title.toLowerCase().includes(normalizedTitle)
        ) {
          continue;
        }

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
  }, [
    allProjects,
    collections,
    groupedProjectIds,
    normalizedTitle,
    projectsById,
    selectedSizes,
  ]);

  return {
    collections,
    feedItems,
    hasLibrary: totalProjectCount > 0 || collections.length > 0,
    projectsById,
    sizeOptions,
  };
}
