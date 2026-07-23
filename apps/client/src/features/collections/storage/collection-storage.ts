import {
  BasicIndex,
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import {
  type LocalCollection,
  type LocalCollectionItem,
  localCollectionItemSchema,
  localCollectionSchema,
} from "@/features/collections/storage/collection-schema";

const COLLECTIONS_STORAGE_KEY = "bead:collections";
const COLLECTION_ITEMS_STORAGE_KEY = "bead:collection-items";

export const collectionsCollection = createCollection(
  localStorageCollectionOptions({
    id: "collections",
    schema: localCollectionSchema,
    storageKey: COLLECTIONS_STORAGE_KEY,
    getKey: (collection) => collection.id,
  }),
);

export const collectionItemsCollection = createCollection(
  localStorageCollectionOptions({
    id: "collection-items",
    schema: localCollectionItemSchema,
    storageKey: COLLECTION_ITEMS_STORAGE_KEY,
    getKey: (item) => getCollectionItemKey(item.collectionId, item.projectId),
  }),
);

collectionsCollection.createIndex((collection) => collection.id, {
  indexType: BasicIndex,
});
collectionItemsCollection.createIndex((item) => item.collectionId, {
  indexType: BasicIndex,
});
collectionItemsCollection.createIndex((item) => item.projectId, {
  indexType: BasicIndex,
});

export async function preloadCollectionStorage() {
  await Promise.all([
    collectionsCollection.preload(),
    collectionItemsCollection.preload(),
  ]);
  return null;
}

export function getCollectionItems(collectionId: string) {
  return [...collectionItemsCollection.values()]
    .filter((item) => item.collectionId === collectionId)
    .sort((left, right) => left.position - right.position);
}

export function getCollectionItemKey(collectionId: string, projectId: string) {
  return JSON.stringify([collectionId, projectId]);
}

export type { LocalCollection, LocalCollectionItem };
