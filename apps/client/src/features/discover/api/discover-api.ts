import type {
  DiscoverProject,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { api } from "@/lib/api";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export async function fetchDiscoverProjects(): Promise<DiscoverProject[]> {
  const response = await api.discover.$get();

  if (!response.ok) {
    return throwResponseError(response, "加载发现作品失败");
  }

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

  if (!response.ok) {
    return throwResponseError(response, "加载发现作品失败");
  }

  const body = await response.json();
  return body.project;
}

export async function publishDiscoverProject(
  project: PublishDiscoverProject,
): Promise<DiscoverProject> {
  const response = await api.discover.$post({ json: { project } });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    return throwResponseError(response, "发布作品失败");
  }

  const body = await response.json();
  return body.project;
}

async function throwResponseError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let message = fallbackMessage;

  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      message = body.error;
    }
  } catch {
    // Infrastructure failures may return an empty or non-JSON response.
  }

  throw new Error(message);
}
