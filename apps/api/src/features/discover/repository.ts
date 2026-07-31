import {
  type DiscoverProject,
  discoverProjectSchema,
  MAX_DISCOVER_FEED_PAGE_SIZE,
  type PublishDiscoverProject,
} from "@bead/core/discover";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { discoverProjects } from "../../db/schema.js";

type DiscoverProjectRow = typeof discoverProjects.$inferSelect;

function toDiscoverProject(project: DiscoverProjectRow): DiscoverProject {
  return discoverProjectSchema.parse({
    ...project,
    publishedAt: project.publishedAt.getTime(),
  });
}

export async function listDiscoverProjects(): Promise<DiscoverProject[]> {
  const projects = await db
    .select()
    .from(discoverProjects)
    .orderBy(desc(discoverProjects.publishedAt), desc(discoverProjects.id))
    .limit(MAX_DISCOVER_FEED_PAGE_SIZE);

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

export async function createDiscoverProject(
  project: PublishDiscoverProject,
): Promise<DiscoverProject> {
  const [createdProject] = await db
    .insert(discoverProjects)
    .values(project)
    .returning();

  return toDiscoverProject(createdProject);
}
