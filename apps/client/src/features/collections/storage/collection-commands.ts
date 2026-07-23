import { createTransaction } from "@tanstack/react-db";
import { projectsCollection } from "@/features/bead/storage/projects";
import {
  collectionItemsCollection,
  collectionsCollection,
  getCollectionItems,
  type LocalCollection,
  type LocalCollectionItem,
  preloadCollectionStorage,
} from "@/features/collections/storage/collection-storage";

export const DEFAULT_COLLECTION_TITLE = "未命名合集";

export async function preloadLocalCollections() {
  await Promise.all([projectsCollection.preload(), preloadCollectionStorage()]);
  return null;
}

export async function createLocalCollection({
  projectIds,
  title,
}: {
  projectIds: string[];
  title: string;
}) {
  await preloadLocalCollections();
  const uniqueProjectIds = getUniqueExistingProjectIds(projectIds);

  if (uniqueProjectIds.length === 0) {
    throw new Error("A collection requires at least one project");
  }

  const now = Date.now();
  const collection: LocalCollection = {
    id: crypto.randomUUID(),
    title: normalizeCollectionTitle(title),
    createdAt: now,
    updatedAt: now,
  };
  const items = createCollectionItems(collection.id, uniqueProjectIds, now);

  await commitCollectionMutation(() => {
    collectionsCollection.insert(collection);
    collectionItemsCollection.insert(items);
  });

  return collection;
}

export async function addProjectsToCollection({
  collectionId,
  projectIds,
}: {
  collectionId: string;
  projectIds: string[];
}) {
  await preloadLocalCollections();
  const collection = getRequiredCollection(collectionId);
  const existingItems = getCollectionItems(collectionId);
  const existingProjectIds = new Set(
    existingItems.map((item) => item.projectId),
  );
  const nextProjectIds = getUniqueExistingProjectIds(projectIds).filter(
    (projectId) => !existingProjectIds.has(projectId),
  );

  if (nextProjectIds.length === 0) {
    return;
  }

  const now = Date.now();
  const nextPosition =
    Math.max(-1, ...existingItems.map((item) => item.position)) + 1;
  const items = createCollectionItems(
    collectionId,
    nextProjectIds,
    now,
    nextPosition,
  );

  await commitCollectionMutation(() => {
    collectionItemsCollection.insert(items);
    collectionsCollection.update(collection.id, (draft) => {
      draft.updatedAt = now;
    });
  });
}

export async function removeProjectFromCollection({
  collectionId,
  projectId,
}: {
  collectionId: string;
  projectId: string;
}) {
  await preloadCollectionStorage();
  getRequiredCollection(collectionId);
  const items = getCollectionItems(collectionId);
  const removedItem = items.find((item) => item.projectId === projectId);

  if (!removedItem) {
    return;
  }

  const remainingItems = items.filter((item) => item.id !== removedItem.id);
  const now = Date.now();

  await commitCollectionMutation(() => {
    collectionItemsCollection.delete(removedItem.id);
    reindexItems(remainingItems);
    collectionsCollection.update(collectionId, (draft) => {
      draft.updatedAt = now;
    });
  });
}

export async function moveCollectionProject({
  collectionId,
  direction,
  projectId,
}: {
  collectionId: string;
  direction: -1 | 1;
  projectId: string;
}) {
  await preloadCollectionStorage();
  getRequiredCollection(collectionId);
  const items = getCollectionItems(collectionId);
  const currentIndex = items.findIndex((item) => item.projectId === projectId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return;
  }

  const currentItem = items[currentIndex];
  const nextItem = items[nextIndex];
  const now = Date.now();

  await commitCollectionMutation(() => {
    collectionItemsCollection.update(currentItem.id, (draft) => {
      draft.position = nextItem.position;
    });
    collectionItemsCollection.update(nextItem.id, (draft) => {
      draft.position = currentItem.position;
    });
    collectionsCollection.update(collectionId, (draft) => {
      draft.updatedAt = now;
    });
  });
}

export async function renameLocalCollection({
  collectionId,
  title,
}: {
  collectionId: string;
  title: string;
}) {
  await preloadCollectionStorage();
  const collection = getRequiredCollection(collectionId);
  const nextTitle = normalizeCollectionTitle(title);

  if (collection.title === nextTitle) {
    return;
  }

  await commitCollectionMutation(() => {
    collectionsCollection.update(collectionId, (draft) => {
      draft.title = nextTitle;
      draft.updatedAt = Date.now();
    });
  });
}

export async function deleteLocalCollection(collectionId: string) {
  await preloadCollectionStorage();
  getRequiredCollection(collectionId);
  const itemIds = getCollectionItems(collectionId).map((item) => item.id);

  await commitCollectionMutation(() => {
    if (itemIds.length > 0) {
      collectionItemsCollection.delete(itemIds);
    }
    collectionsCollection.delete(collectionId);
  });
}

function getRequiredCollection(collectionId: string) {
  const collection = collectionsCollection.get(collectionId);

  if (!collection) {
    throw new Error(`Bead collection not found: ${collectionId}`);
  }

  return collection;
}

function getUniqueExistingProjectIds(projectIds: string[]) {
  return [...new Set(projectIds)].filter((projectId) =>
    projectsCollection.has(projectId),
  );
}

function createCollectionItems(
  collectionId: string,
  projectIds: string[],
  addedAt: number,
  startPosition = 0,
): LocalCollectionItem[] {
  return projectIds.map((projectId, index) => ({
    id: crypto.randomUUID(),
    collectionId,
    projectId,
    position: startPosition + index,
    addedAt,
  }));
}

function reindexItems(items: LocalCollectionItem[]) {
  items.forEach((item, position) => {
    if (item.position === position) {
      return;
    }

    collectionItemsCollection.update(item.id, (draft) => {
      draft.position = position;
    });
  });
}

function normalizeCollectionTitle(title: string) {
  const normalizedTitle = title.trim().slice(0, 80);
  return normalizedTitle || DEFAULT_COLLECTION_TITLE;
}

function commitCollectionMutation(mutator: () => void) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction }) => {
      collectionsCollection.utils.acceptMutations(transaction);
      collectionItemsCollection.utils.acceptMutations(transaction);
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}
