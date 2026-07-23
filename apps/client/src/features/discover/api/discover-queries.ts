import type {
  PublishDiscoverCollection,
  PublishDiscoverProject,
} from "@bead/core/discover";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchDiscoverCollection,
  fetchDiscoverCollections,
  fetchDiscoverProject,
  fetchDiscoverProjects,
  publishDiscoverCollection,
  publishDiscoverProjects,
} from "@/features/discover/api/discover-api";

export const discoverQueryKeys = {
  all: ["discover"] as const,
  list: () => [...discoverQueryKeys.all, "list"] as const,
  detail: (projectId: string) =>
    [...discoverQueryKeys.all, "detail", projectId] as const,
  collections: () => [...discoverQueryKeys.all, "collections"] as const,
  collectionDetail: (collectionId: string) =>
    [...discoverQueryKeys.collections(), collectionId] as const,
};

export const discoverProjectsQueryOptions = queryOptions({
  queryKey: discoverQueryKeys.list(),
  queryFn: fetchDiscoverProjects,
});

export function discoverProjectQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: discoverQueryKeys.detail(projectId),
    queryFn: () => fetchDiscoverProject(projectId),
  });
}

export const discoverCollectionsQueryOptions = queryOptions({
  queryKey: discoverQueryKeys.collections(),
  queryFn: fetchDiscoverCollections,
});

export function discoverCollectionQueryOptions(collectionId: string) {
  return queryOptions({
    queryKey: discoverQueryKeys.collectionDetail(collectionId),
    queryFn: () => fetchDiscoverCollection(collectionId),
  });
}

export function usePublishDiscoverProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projects: PublishDiscoverProject[]) =>
      publishDiscoverProjects(projects),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoverQueryKeys.list(),
      });
    },
  });
}

export function usePublishDiscoverCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collection: PublishDiscoverCollection) =>
      publishDiscoverCollection(collection),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoverQueryKeys.all,
      });
    },
  });
}
