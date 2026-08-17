import {
  type DiscoverProject,
  type DiscoverProjectListItem,
  MAX_DISCOVER_FEED_PAGE_SIZE,
  type PublishDiscoverProject,
} from "@bead/core/discover";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { discoverProjects } from "../../db/schema.js";
import { discoverThumbnailPath } from "./object-keys.js";
import { storeDiscoverThumbnail } from "./thumbnail-store.js";

type DiscoverProjectRow = typeof discoverProjects.$inferSelect;

export type DiscoverProjectSummary = Omit<
  DiscoverProjectListItem,
  "thumbnailUrl"
>;

function toDiscoverProject(project: DiscoverProjectRow): DiscoverProject {
  return {
    ...project,
    publishedAt: project.publishedAt.getTime(),
  };
}

function toDiscoverProjectSummary(
  project: Pick<DiscoverProjectRow, "id" | "publishedAt" | "sizeId" | "title">,
): DiscoverProjectSummary {
  return {
    id: project.id,
    publishedAt: project.publishedAt.getTime(),
    sizeId: project.sizeId,
    title: project.title,
  };
}

export async function listDiscoverProjects(): Promise<
  DiscoverProjectSummary[]
> {
  const projects = await db
    .select({
      id: discoverProjects.id,
      publishedAt: discoverProjects.publishedAt,
      sizeId: discoverProjects.sizeId,
      title: discoverProjects.title,
    })
    .from(discoverProjects)
    .orderBy(desc(discoverProjects.publishedAt), desc(discoverProjects.id))
    .limit(MAX_DISCOVER_FEED_PAGE_SIZE);

  return projects.map(toDiscoverProjectSummary);
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

export async function createDiscoverProject(
  project: PublishDiscoverProject,
): Promise<DiscoverProject> {
  const [createdProject] = await db
    .insert(discoverProjects)
    .values(project)
    .returning();

  try {
    await storeDiscoverThumbnail({
      projectId: createdProject.id,
      sizeId: createdProject.sizeId,
      snapshot: createdProject.snapshot,
    });
  } catch (error) {
    console.error("Failed to store discover thumbnail", error);
  }

  return toDiscoverProject(createdProject);
}

export function toDiscoverProjectListItem(
  project: DiscoverProjectSummary,
): DiscoverProjectListItem {
  return {
    ...project,
    thumbnailUrl: discoverThumbnailPath(project.id),
  };
}
