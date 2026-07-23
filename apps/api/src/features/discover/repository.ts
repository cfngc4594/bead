import type {
  DiscoverCollection,
  DiscoverProject,
  PublishDiscoverCollection,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import {
  discoverCollectionItems,
  discoverCollections,
  discoverProjects,
} from "../../db/schema";

type DiscoverProjectRow = typeof discoverProjects.$inferSelect;
type DiscoverCollectionRow = typeof discoverCollections.$inferSelect;

function toDiscoverProject(project: DiscoverProjectRow): DiscoverProject {
  return {
    ...project,
    publishedAt: project.publishedAt.getTime(),
  };
}

export async function listDiscoverProjects(): Promise<DiscoverProject[]> {
  const projects = await db
    .select()
    .from(discoverProjects)
    .orderBy(desc(discoverProjects.publishedAt), desc(discoverProjects.id))
    .limit(60);

  return projects.map(toDiscoverProject);
}

export async function findDiscoverProject(
  projectId: string,
): Promise<DiscoverProject | null> {
  const [project] = await db
    .select()
    .from(discoverProjects)
    .where(eq(discoverProjects.id, projectId))
    .limit(1);

  return project ? toDiscoverProject(project) : null;
}

export async function createDiscoverProjects(
  projects: PublishDiscoverProject[],
): Promise<DiscoverProject[]> {
  const createdProjects = await db
    .insert(discoverProjects)
    .values(projects)
    .returning();

  return createdProjects.map(toDiscoverProject);
}

export async function listDiscoverCollections(): Promise<DiscoverCollection[]> {
  const collections = await db
    .select()
    .from(discoverCollections)
    .orderBy(
      desc(discoverCollections.publishedAt),
      desc(discoverCollections.id),
    )
    .limit(30);
  const projectsByCollection = await listCollectionProjects(
    collections.map((collection) => collection.id),
  );

  return collections.map((collection) =>
    toDiscoverCollection(
      collection,
      projectsByCollection.get(collection.id) ?? [],
    ),
  );
}

export async function findDiscoverCollection(
  collectionId: string,
): Promise<DiscoverCollection | null> {
  const [collection] = await db
    .select()
    .from(discoverCollections)
    .where(eq(discoverCollections.id, collectionId))
    .limit(1);

  if (!collection) {
    return null;
  }

  const projectsByCollection = await listCollectionProjects([collectionId]);
  return toDiscoverCollection(
    collection,
    projectsByCollection.get(collectionId) ?? [],
  );
}

export function createDiscoverCollection(
  collection: PublishDiscoverCollection,
): Promise<DiscoverCollection> {
  return db.transaction(async (transaction) => {
    const collectionId = crypto.randomUUID();
    const publishedAt = new Date();
    const projectValues = collection.projects.map((project) => ({
      ...project,
      id: crypto.randomUUID(),
      publishedAt,
    }));

    await transaction.insert(discoverCollections).values({
      id: collectionId,
      title: collection.title,
      publishedAt,
    });
    await transaction.insert(discoverProjects).values(projectValues);
    await transaction.insert(discoverCollectionItems).values(
      projectValues.map((project, position) => ({
        collectionId,
        position,
        projectId: project.id,
      })),
    );

    return {
      id: collectionId,
      title: collection.title,
      publishedAt: publishedAt.getTime(),
      projects: projectValues.map(toDiscoverProject),
    };
  });
}

function toDiscoverCollection(
  collection: DiscoverCollectionRow,
  projects: DiscoverProject[],
): DiscoverCollection {
  return {
    id: collection.id,
    title: collection.title,
    publishedAt: collection.publishedAt.getTime(),
    projects,
  };
}

async function listCollectionProjects(collectionIds: string[]) {
  const projectsByCollection = new Map<string, DiscoverProject[]>();

  if (collectionIds.length === 0) {
    return projectsByCollection;
  }

  const items = await db
    .select({
      collectionId: discoverCollectionItems.collectionId,
      project: discoverProjects,
    })
    .from(discoverCollectionItems)
    .innerJoin(
      discoverProjects,
      eq(discoverCollectionItems.projectId, discoverProjects.id),
    )
    .where(inArray(discoverCollectionItems.collectionId, collectionIds))
    .orderBy(
      asc(discoverCollectionItems.collectionId),
      asc(discoverCollectionItems.position),
    );

  for (const item of items) {
    const projects = projectsByCollection.get(item.collectionId) ?? [];
    projects.push(toDiscoverProject(item.project));
    projectsByCollection.set(item.collectionId, projects);
  }

  return projectsByCollection;
}
