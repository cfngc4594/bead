import {
  createLiveQueryCollection,
  eq,
  toArray,
  useLiveQuery,
} from "@tanstack/react-db";
import { projectsCollection } from "@/features/bead/storage/projects";
import {
  collectionItemsCollection,
  collectionsCollection,
} from "@/features/collections/storage/collection-storage";

const collectionsWithProjectsCollection = createLiveQueryCollection((query) =>
  query
    .from({ collection: collectionsCollection })
    .select(({ collection }) => ({
      id: collection.id,
      title: collection.title,
      sourceDiscoverCollectionId: collection.sourceDiscoverCollectionId,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      projects: toArray(
        query
          .from({ item: collectionItemsCollection })
          .innerJoin({ project: projectsCollection }, ({ item, project }) =>
            eq(item.projectId, project.id),
          )
          .where(({ item }) => eq(item.collectionId, collection.id))
          .orderBy(({ item }) => item.position, "asc")
          .select(({ project }) => ({
            id: project.id,
            title: project.title,
            sizeId: project.sizeId,
            snapshots: project.snapshots,
            currentIndex: project.currentIndex,
            sourceDiscoverProjectId: project.sourceDiscoverProjectId,
            updatedAt: project.updatedAt,
          })),
      ),
    })),
);

export function useLocalCollections() {
  return useLiveQuery(
    (query) =>
      query
        .from({ collection: collectionsWithProjectsCollection })
        .orderBy(({ collection }) => collection.updatedAt, "desc"),
    [],
  );
}

export function useLocalCollection(collectionId: string) {
  return useLiveQuery(
    (query) =>
      query
        .from({ collection: collectionsWithProjectsCollection })
        .where(({ collection }) => eq(collection.id, collectionId)),
    [collectionId],
  );
}
