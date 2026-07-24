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

export type LibrarySort = "updatedAt" | "title";

export function useLibraryFeed({
  selectedSizes,
  sort = "updatedAt",
  titleFilter,
}: {
  selectedSizes: string[];
  sort?: LibrarySort;
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

  const collectionByProjectId = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();

    for (const collection of collections) {
      for (const projectId of collection.projectIds) {
        map.set(projectId, { id: collection.id, title: collection.title });
      }
    }

    return map;
  }, [collections]);

  const feedItems = useMemo(() => {
    const items: LibraryFeedItem<
      (typeof allProjects)[number],
      LocalCollection
    >[] = [];

    for (const project of allProjects) {
      const isGrouped = groupedProjectIds.has(project.id);
      const matchesTitle =
        normalizedTitle.length === 0 ||
        project.title.toLowerCase().includes(normalizedTitle);
      const matchesSize =
        selectedSizes.length === 0 || selectedSizes.includes(project.sizeId);

      if (!matchesTitle || !matchesSize) {
        continue;
      }

      // Ungrouped projects always appear. Grouped projects appear only when
      // searching so users can find works that live inside a collection.
      if (isGrouped && normalizedTitle.length === 0) {
        continue;
      }

      const collection = collectionByProjectId.get(project.id);

      items.push({
        kind: "project",
        id: project.id,
        project,
        collectionId: isGrouped ? collection?.id : undefined,
        collectionTitle: isGrouped ? collection?.title : undefined,
      });
    }

    for (const collection of collections) {
      const collectionProjects = collection.projectIds.flatMap((projectId) => {
        const project = projectsById.get(projectId);
        return project ? [project] : [];
      });

      const matchesTitle =
        normalizedTitle.length === 0 ||
        collection.title.toLowerCase().includes(normalizedTitle) ||
        collectionProjects.some((project) =>
          project.title.toLowerCase().includes(normalizedTitle),
        );

      const matchesSize =
        selectedSizes.length === 0 ||
        collectionProjects.some((project) =>
          selectedSizes.includes(project.sizeId),
        );

      if (!matchesTitle || !matchesSize) {
        continue;
      }

      items.push({
        kind: "collection",
        id: collection.id,
        collection,
        projects: collectionProjects,
      });
    }

    items.sort((left, right) => {
      if (sort === "title") {
        const leftTitle =
          left.kind === "project" ? left.project.title : left.collection.title;
        const rightTitle =
          right.kind === "project"
            ? right.project.title
            : right.collection.title;
        return leftTitle.localeCompare(rightTitle, "zh");
      }

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
    collectionByProjectId,
    collections,
    groupedProjectIds,
    normalizedTitle,
    projectsById,
    selectedSizes,
    sort,
  ]);

  const ungroupedProjects = useMemo(
    () => allProjects.filter((project) => !groupedProjectIds.has(project.id)),
    [allProjects, groupedProjectIds],
  );

  return {
    collections,
    feedItems,
    hasLibrary: totalProjectCount > 0 || collections.length > 0,
    projectsById,
    sizeOptions,
    ungroupedProjects,
  };
}
