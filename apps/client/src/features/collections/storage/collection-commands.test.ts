import { expect, test } from "bun:test";
import {
  createProject,
  deleteProject,
  projectsCollection,
} from "@/features/bead/storage/projects";
import {
  addProjectsToCollection,
  addProjectToCollection,
  createLocalCollection,
  deleteLocalCollection,
  mergeProjectsIntoCollection,
  removeProjectFromCollection,
  reorderCollectionProjects,
} from "@/features/collections/storage/collection-commands";
import { collectionsCollection } from "@/features/collections/storage/collection-storage";

test("merging projects creates an exclusive collection", async () => {
  const first = await createProject("16x16");
  const second = await createProject("16x16");
  const third = await createProject("16x16");

  try {
    const collection = await mergeProjectsIntoCollection({
      sourceProjectId: first.id,
      targetProjectId: second.id,
    });

    expect(collection.projectIds).toEqual([second.id, first.id]);

    await addProjectToCollection({
      collectionId: collection.id,
      projectId: third.id,
    });
    expect(collectionsCollection.get(collection.id)?.projectIds).toEqual([
      second.id,
      first.id,
      third.id,
    ]);

    await reorderCollectionProjects({
      collectionId: collection.id,
      projectIds: [second.id, third.id, first.id],
    });
    expect(collectionsCollection.get(collection.id)?.projectIds).toEqual([
      second.id,
      third.id,
      first.id,
    ]);

    await removeProjectFromCollection({
      collectionId: collection.id,
      projectId: third.id,
    });
    expect(collectionsCollection.get(collection.id)?.projectIds).toEqual([
      second.id,
      first.id,
    ]);

    await deleteProject(first.id);
    expect(collectionsCollection.has(collection.id)).toBe(false);
  } finally {
    for (const projectId of [first.id, second.id, third.id]) {
      if (projectsCollection.has(projectId)) {
        await deleteProject(projectId);
      }
    }
    for (const collection of [...collectionsCollection.values()]) {
      await deleteLocalCollection(collection.id);
    }
  }
});

test("deleting a collection preserves its projects", async () => {
  const first = await createProject("16x16");
  const second = await createProject("16x16");
  const collection = await createLocalCollection({
    projectIds: [first.id, second.id],
    title: "Disposable collection",
  });

  try {
    await deleteLocalCollection(collection.id);
    expect(projectsCollection.has(first.id)).toBe(true);
    expect(projectsCollection.has(second.id)).toBe(true);
  } finally {
    if (collectionsCollection.has(collection.id)) {
      await deleteLocalCollection(collection.id);
    }
    for (const projectId of [first.id, second.id]) {
      if (projectsCollection.has(projectId)) {
        await deleteProject(projectId);
      }
    }
  }
});

test("addProjectsToCollection appends multiple projects", async () => {
  const first = await createProject("16x16");
  const second = await createProject("16x16");
  const third = await createProject("16x16");
  const fourth = await createProject("16x16");

  try {
    const collection = await createLocalCollection({
      projectIds: [first.id, second.id],
      title: "Bulk",
    });

    await addProjectsToCollection({
      collectionId: collection.id,
      projectIds: [third.id, fourth.id, third.id],
    });

    expect(collectionsCollection.get(collection.id)?.projectIds).toEqual([
      first.id,
      second.id,
      third.id,
      fourth.id,
    ]);
  } finally {
    for (const collection of [...collectionsCollection.values()]) {
      await deleteLocalCollection(collection.id);
    }
    for (const projectId of [first.id, second.id, third.id, fourth.id]) {
      if (projectsCollection.has(projectId)) {
        await deleteProject(projectId);
      }
    }
  }
});

test("a project can only belong to one collection", async () => {
  const first = await createProject("16x16");
  const second = await createProject("16x16");
  const third = await createProject("16x16");
  const fourth = await createProject("16x16");

  try {
    const left = await createLocalCollection({
      projectIds: [first.id, second.id],
      title: "Left",
    });
    const right = await createLocalCollection({
      projectIds: [third.id, fourth.id],
      title: "Right",
    });

    await addProjectToCollection({
      collectionId: right.id,
      projectId: first.id,
    });

    expect(collectionsCollection.has(left.id)).toBe(false);
    expect(collectionsCollection.get(right.id)?.projectIds).toEqual([
      third.id,
      fourth.id,
      first.id,
    ]);
  } finally {
    for (const collection of [...collectionsCollection.values()]) {
      await deleteLocalCollection(collection.id);
    }
    for (const projectId of [first.id, second.id, third.id, fourth.id]) {
      if (projectsCollection.has(projectId)) {
        await deleteProject(projectId);
      }
    }
  }
});
