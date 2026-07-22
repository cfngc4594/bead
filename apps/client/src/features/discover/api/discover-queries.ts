import type { PublishDiscoverProject } from "@bead/core/discover";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchDiscoverProject,
  fetchDiscoverProjects,
  publishDiscoverProjects,
} from "@/features/discover/api/discover-api";

export const discoverQueryKeys = {
  all: ["discover"] as const,
  list: () => [...discoverQueryKeys.all, "list"] as const,
  detail: (projectId: string) =>
    [...discoverQueryKeys.all, "detail", projectId] as const,
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

export function usePublishDiscoverProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projects: PublishDiscoverProject[]) =>
      publishDiscoverProjects(projects),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoverQueryKeys.all,
      });
    },
  });
}
