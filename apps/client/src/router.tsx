import { createRouter } from "@tanstack/react-router";
import { TAB_CONTENT_SELECTOR } from "@/features/navigation/tab-config";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
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
