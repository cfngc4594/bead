import { projectsCollection } from "@/features/bead/storage/projects";
import {
  collectionsCollection,
  detachProjectFromCollections,
  type LocalCollection,
  preloadCollectionStorage,
} from "@/features/collections/storage/collection-storage";
import { commitLocalStorageMutation } from "@/lib/local-storage-transaction";

export const DEFAULT_COLLECTION_TITLE = "未命名合集";

export async function preloadLocalCollections() {
  await Promise.all([projectsCollection.preload(), preloadCollectionStorage()]);
  return null;
}

/** Create a collection from ungrouped (or forcibly moved) projects. */
export async function createLocalCollection({
  projectIds,
  title = "",
}: {
  projectIds: string[];
  title?: string;
}) {
  await preloadLocalCollections();
  const uniqueProjectIds = getUniqueExistingProjectIds(projectIds);

  if (uniqueProjectIds.length < 2) {
    throw new Error("A collection requires at least two projects");
  }

  const now = Date.now();
  const collection: LocalCollection = {
    id: crypto.randomUUID(),
    title: normalizeCollectionTitle(title),
    projectIds: uniqueProjectIds,
    createdAt: now,
    updatedAt: now,
  };

  await commitCollectionMutation(() => {
    for (const projectId of uniqueProjectIds) {
      detachProjectFromCollections(projectId);
    }
    collectionsCollection.insert(collection);
  });

  return collection;
}

/** Drag project A onto project B → collection at B with [B, A]. */
export async function mergeProjectsIntoCollection({
  sourceProjectId,
  targetProjectId,
  title = "",
}: {
  sourceProjectId: string;
  targetProjectId: string;
  title?: string;
}) {
  if (sourceProjectId === targetProjectId) {
    throw new Error("Cannot merge a project with itself");
  }

  return createLocalCollection({
    projectIds: [targetProjectId, sourceProjectId],
    title,
  });
}

/** Drag an ungrouped project onto a collection. */
export async function addProjectToCollection({
  collectionId,
  projectId,
}: {
  collectionId: string;
  projectId: string;
}) {
  await preloadLocalCollections();
  const collection = getRequiredCollection(collectionId);

  if (!projectsCollection.has(projectId)) {
    throw new Error(`Bead project not found: ${projectId}`);
  }

  if (collection.projectIds.includes(projectId)) {
    return collection;
  }

  const now = Date.now();

  await commitCollectionMutation(() => {
    detachProjectFromCollections(projectId);
    const current = getRequiredCollection(collectionId);
    collectionsCollection.update(collectionId, (draft) => {
      draft.projectIds = [...current.projectIds, projectId];
      draft.updatedAt = now;
    });
  });

  return getRequiredCollection(collectionId);
}

/** Remove a project from its collection; dissolve if fewer than 2 remain. */
export async function removeProjectFromCollection({
  collectionId,
  projectId,
}: {
  collectionId: string;
  projectId: string;
}) {
  await preloadCollectionStorage();
  const collection = collectionsCollection.get(collectionId);

  if (!collection || !collection.projectIds.includes(projectId)) {
    return;
  }

  const nextProjectIds = collection.projectIds.filter((id) => id !== projectId);

  await commitCollectionMutation(() => {
    if (nextProjectIds.length < 2) {
      collectionsCollection.delete(collectionId);
      return;
    }

    collectionsCollection.update(collectionId, (draft) => {
      draft.projectIds = nextProjectIds;
      draft.updatedAt = Date.now();
    });
  });
}

export async function reorderCollectionProjects({
  collectionId,
  projectIds,
}: {
  collectionId: string;
  projectIds: string[];
}) {
  await preloadCollectionStorage();
  const collection = getRequiredCollection(collectionId);
  const currentSet = new Set(collection.projectIds);

  if (
    projectIds.length !== collection.projectIds.length ||
    projectIds.some((projectId) => !currentSet.has(projectId))
  ) {
    throw new Error("Collection reorder must include the same projects");
  }

  await commitCollectionMutation(() => {
    collectionsCollection.update(collectionId, (draft) => {
      draft.projectIds = projectIds;
      draft.updatedAt = Date.now();
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

  await commitCollectionMutation(() => {
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

function normalizeCollectionTitle(title: string) {
  const normalizedTitle = title.trim().slice(0, 80);
  return normalizedTitle || DEFAULT_COLLECTION_TITLE;
}

function commitCollectionMutation(mutator: () => void) {
  return commitLocalStorageMutation(
    mutator,
    collectionsCollection.utils.acceptMutations,
  );
}
