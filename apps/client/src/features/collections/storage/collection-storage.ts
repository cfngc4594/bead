import {
  BasicIndex,
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import {
  type LocalCollection,
  localCollectionSchema,
} from "@/features/collections/storage/collection-schema";

const COLLECTIONS_STORAGE_KEY = "bead:library-collections";
const LEGACY_COLLECTIONS_STORAGE_KEY = "bead:collections";
const LEGACY_COLLECTION_ITEMS_STORAGE_KEY = "bead:collection-items";

export const collectionsCollection = createCollection(
  localStorageCollectionOptions({
    id: "library-collections",
    schema: localCollectionSchema,
    storageKey: COLLECTIONS_STORAGE_KEY,
    getKey: (collection) => collection.id,
  }),
);

collectionsCollection.createIndex((collection) => collection.id, {
  indexType: BasicIndex,
});

export async function preloadCollectionStorage() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LEGACY_COLLECTIONS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_COLLECTION_ITEMS_STORAGE_KEY);
  }

  await collectionsCollection.preload();
  return null;
}

export function getCollectionProjectIds(collectionId: string) {
  return collectionsCollection.get(collectionId)?.projectIds ?? [];
}

export function findCollectionIdForProject(projectId: string) {
  for (const collection of collectionsCollection.values()) {
    if (collection.projectIds.includes(projectId)) {
      return collection.id;
    }
  }

  return null;
}

/** Drop a project from every collection; dissolve collections with fewer than 2. */
export function detachProjectFromCollections(projectId: string) {
  for (const collection of [...collectionsCollection.values()]) {
    if (!collection.projectIds.includes(projectId)) {
      continue;
    }

    const nextProjectIds = collection.projectIds.filter(
      (id) => id !== projectId,
    );

    if (nextProjectIds.length < 2) {
      collectionsCollection.delete(collection.id);
      continue;
    }

    collectionsCollection.update(collection.id, (draft) => {
      draft.projectIds = nextProjectIds;
      draft.updatedAt = Date.now();
    });
  }
}

export type { LocalCollection };
