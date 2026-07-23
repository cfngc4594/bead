import {
  type DiscoverCollection,
  MAX_DISCOVER_PROJECTS_PER_PUBLISH,
  type PublishDiscoverCollection,
} from "@bead/core/discover";
import {
  buildProjectFromSnapshot,
  getFilledCount,
  type Project,
  projectsCollection,
} from "@/features/bead/storage/projects";
import { preloadLocalCollections } from "@/features/collections/storage/collection-commands";
import {
  collectionItemsCollection,
  collectionsCollection,
  getCollectionItems,
  type LocalCollection,
  type LocalCollectionItem,
} from "@/features/collections/storage/collection-storage";
import { createPublishInput } from "@/features/discover/lib/create-publish-input";
import { commitLocalStorageMutation } from "@/lib/local-storage-transaction";

type PublishableProject = Pick<
  Project,
  "currentIndex" | "sizeId" | "snapshots" | "title"
>;

export async function importDiscoverCollection(
  discoverCollection: DiscoverCollection,
) {
  await preloadLocalCollections();
  const now = Date.now();
  const projects = discoverCollection.projects.map((project) =>
    buildProjectFromSnapshot({
      sizeId: project.sizeId,
      snapshot: project.snapshot,
      title: project.title,
      updatedAt: now,
    }),
  );
  const collection: LocalCollection = {
    id: crypto.randomUUID(),
    title: discoverCollection.title,
    createdAt: now,
    updatedAt: now,
  };
  const items: LocalCollectionItem[] = projects.map((project, position) => ({
    collectionId: collection.id,
    projectId: project.id,
    position,
  }));

  await commitLibraryMutation(() => {
    projectsCollection.insert(projects);
    collectionsCollection.insert(collection);
    collectionItemsCollection.insert(items);
  });

  return collection;
}

export async function createPublishCollectionInput(
  collectionId: string,
): Promise<PublishDiscoverCollection> {
  await preloadLocalCollections();
  const collection = collectionsCollection.get(collectionId);

  if (!collection) {
    throw new Error(`Bead collection not found: ${collectionId}`);
  }

  const projects = getCollectionItems(collectionId)
    .map((item) => projectsCollection.get(item.projectId))
    .filter((project) => project !== undefined);
  const publishIssue = getCollectionPublishIssue(projects);

  if (publishIssue) {
    throw new Error(publishIssue);
  }

  return {
    title: collection.title,
    projects: projects.map(createPublishInput),
  } satisfies PublishDiscoverCollection;
}

export function getCollectionPublishIssue(projects: PublishableProject[]) {
  if (projects.length === 0) {
    return "合集为空，添加作品后才能发布";
  }

  if (projects.length > MAX_DISCOVER_PROJECTS_PER_PUBLISH) {
    return `每个合集最多发布 ${MAX_DISCOVER_PROJECTS_PER_PUBLISH} 个作品`;
  }

  if (projects.some((project) => getFilledCount(project) === 0)) {
    return "合集包含空白作品，完成后才能发布";
  }

  return null;
}

function commitLibraryMutation(mutator: () => void) {
  return commitLocalStorageMutation(
    mutator,
    projectsCollection.utils.acceptMutations,
    collectionsCollection.utils.acceptMutations,
    collectionItemsCollection.utils.acceptMutations,
  );
}
