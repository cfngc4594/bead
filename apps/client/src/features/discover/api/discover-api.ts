import type { DiscoverProject, PublishDiscoverProject } from "@bead/api";
import { api } from "@/lib/api";

export async function fetchDiscoverProjects(): Promise<DiscoverProject[]> {
  const response = await api.discover.$get();

  await assertOk(response, "加载发现作品失败");
  const body = await response.json();
  return body.projects;
}

export async function fetchDiscoverProject(
  projectId: string,
): Promise<DiscoverProject | null> {
  const response = await api.discover[":projectId"].$get({
    param: { projectId },
  });

  if (response.status === 404) {
    return null;
  }

  await assertOk(response, "加载发现作品失败");
  const body = await response.json();

  if (!("project" in body)) {
    throw new Error("Discover project response is missing project data");
  }

  return body.project;
}

export async function publishDiscoverProjects(
  projects: PublishDiscoverProject[],
): Promise<DiscoverProject[]> {
  const response = await api.discover.$post({ json: { projects } });

  await assertOk(response, "发布作品失败");
  const body = await response.json();

  if (!("projects" in body)) {
    throw new Error("Discover publish response is missing project data");
  }

  return body.projects;
}

async function assertOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  let message = fallbackMessage;

  try {
    const body: unknown = await response.clone().json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      message = body.error;
    }
  } catch {
    // Keep the user-facing fallback for non-JSON failures.
  }

  throw new Error(message);
}
