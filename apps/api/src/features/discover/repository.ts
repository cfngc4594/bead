import { db } from "@bead/api/db/client";
import { discoverProjects } from "@bead/api/db/schema";
import type {
  DiscoverProject,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { desc, eq } from "drizzle-orm";

type DiscoverProjectRow = typeof discoverProjects.$inferSelect;

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
