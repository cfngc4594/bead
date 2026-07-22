import { supabase } from "../../lib/supabase.js";
import {
  type DiscoverProject,
  discoverProjectRowSchema,
  type PublishDiscoverProject,
} from "./schema.js";

const discoverProjectColumns =
  "id,title,size_id,rows,cols,snapshot,published_at";

export async function listDiscoverProjects(): Promise<DiscoverProject[]> {
  const { data, error } = await supabase
    .from("discover_projects")
    .select(discoverProjectColumns)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(`Unable to list discover projects: ${error.message}`);
  }

  return discoverProjectRowSchema.array().parse(data);
}

export async function findDiscoverProject(
  projectId: string,
): Promise<DiscoverProject | null> {
  const { data, error } = await supabase
    .from("discover_projects")
    .select(discoverProjectColumns)
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load discover project: ${error.message}`);
  }

  return data ? discoverProjectRowSchema.parse(data) : null;
}

export async function createDiscoverProjects(
  projects: PublishDiscoverProject[],
): Promise<DiscoverProject[]> {
  const rows = projects.map((project) => ({
    title: project.title,
    size_id: project.sizeId,
    rows: project.rows,
    cols: project.cols,
    snapshot: project.snapshot,
  }));
  const { data, error } = await supabase
    .from("discover_projects")
    .insert(rows)
    .select(discoverProjectColumns);

  if (error) {
    throw new Error(`Unable to publish discover projects: ${error.message}`);
  }

  return discoverProjectRowSchema.array().parse(data);
}
