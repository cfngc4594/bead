import { eq, useLiveQuery } from "@tanstack/react-db";
import { collectionsCollection } from "@/features/collections/storage/collection-storage";

export function useLocalCollections() {
  return useLiveQuery(
    (query) =>
      query
        .from({ collection: collectionsCollection })
        .orderBy(({ collection }) => collection.updatedAt, "desc"),
    [],
  );
}

export function useLocalCollection(collectionId: string) {
  return useLiveQuery(
    (query) =>
      query
        .from({ collection: collectionsCollection })
        .where(({ collection }) => eq(collection.id, collectionId)),
    [collectionId],
  );
}

export function useGroupedProjectIds() {
  const { data: collections = [] } = useLocalCollections();

  return new Set(collections.flatMap((collection) => collection.projectIds));
}
