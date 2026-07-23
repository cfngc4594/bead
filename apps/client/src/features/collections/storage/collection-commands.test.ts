import { expect, test } from "bun:test";
import {
  createProject,
  deleteProject,
  projectsCollection,
} from "@/features/bead/storage/projects";
import {
  addProjectsToCollection,
  createLocalCollection,
  deleteLocalCollection,
  moveCollectionProject,
  removeProjectFromCollection,
} from "@/features/collections/storage/collection-commands";
import {
  collectionsCollection,
  getCollectionItems,
} from "@/features/collections/storage/collection-storage";

test("deleting a project reindexes memberships before adding another", async () => {
  const first = await createProject("16x16");
  const removed = await createProject("16x16");
  const third = await createProject("16x16");
  const added = await createProject("16x16");
  const collection = await createLocalCollection({
    projectIds: [first.id, removed.id, third.id, first.id],
    title: "Order test",
  });

  try {
    expect(getCollectionItems(collection.id)).toHaveLength(3);
    await deleteProject(removed.id);
    expect(getCollectionItems(collection.id)).toMatchObject([
      { projectId: first.id, position: 0 },
      { projectId: third.id, position: 1 },
    ]);

    await addProjectsToCollection({
      collectionId: collection.id,
      projectIds: [added.id],
    });
    expect(getCollectionItems(collection.id)).toMatchObject([
      { projectId: first.id, position: 0 },
      { projectId: third.id, position: 1 },
      { projectId: added.id, position: 2 },
    ]);

    await moveCollectionProject({
      collectionId: collection.id,
      direction: -1,
      projectId: added.id,
    });
    expect(getCollectionItems(collection.id)).toMatchObject([
      { projectId: first.id, position: 0 },
      { projectId: added.id, position: 1 },
      { projectId: third.id, position: 2 },
    ]);

    await removeProjectFromCollection({
      collectionId: collection.id,
      projectId: added.id,
    });
    expect(getCollectionItems(collection.id)).toMatchObject([
      { projectId: first.id, position: 0 },
      { projectId: third.id, position: 1 },
    ]);
  } finally {
    await deleteLocalCollection(collection.id);
    await Promise.all(
      [first.id, third.id, added.id].map((projectId) =>
        deleteProject(projectId),
      ),
    );
  }
});

test("deleting a collection preserves its projects", async () => {
  const project = await createProject("16x16");
  const collection = await createLocalCollection({
    projectIds: [project.id],
    title: "Disposable collection",
  });

  try {
    await deleteLocalCollection(collection.id);
    expect(projectsCollection.has(project.id)).toBe(true);
  } finally {
    if (collectionsCollection.has(collection.id)) {
      await deleteLocalCollection(collection.id);
    }
    if (projectsCollection.has(project.id)) {
      await deleteProject(project.id);
    }
  }
});
