import { createRouter } from "@tanstack/react-router";
import { TAB_CONTENT_SELECTOR } from "@/features/navigation/tab-config";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  // React Query owns server-state caching; keep router preload from reusing stale data.
  context: { queryClient },
  defaultPreloadStaleTime: 0,
  defaultPreload: "intent",
  routeTree,
  scrollRestoration: true,
  scrollToTopSelectors: [TAB_CONTENT_SELECTOR],
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
