import type {
  DiscoverCollection,
  DiscoverCollectionSummary,
  DiscoverProject,
  PublishDiscoverCollection,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { api } from "@/lib/api";
import { throwResponseError } from "@/lib/api-response";

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

export async function fetchDiscoverCollections(): Promise<
  DiscoverCollectionSummary[]
> {
  const response = await api.discover.collections.$get();

  if (!response.ok) {
    return throwResponseError(response, "加载发现合集失败");
  }

  const body = await response.json();
  return body.collections;
}

export async function fetchDiscoverCollection(
  collectionId: string,
): Promise<DiscoverCollection | null> {
  const response = await api.discover.collections[":collectionId"].$get({
    param: { collectionId },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return throwResponseError(response, "加载发现合集失败");
  }

  const body = await response.json();
  return body.collection;
}

export async function publishDiscoverProjects(
  projects: PublishDiscoverProject[],
): Promise<DiscoverProject[]> {
  const response = await api.discover.$post({ json: { projects } });

  if (!response.ok) {
    return throwResponseError(response, "发布作品失败");
  }

  const body = await response.json();
  return body.projects;
}

export async function publishDiscoverCollection(
  collection: PublishDiscoverCollection,
): Promise<DiscoverCollection> {
  const response = await api.discover.collections.$post({ json: collection });

  if (!response.ok) {
    return throwResponseError(response, "发布合集失败");
  }

  const body = await response.json();
  return body.collection;
}
