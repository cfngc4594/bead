import { createRouter } from "@tanstack/react-router";
import { NATIVE_TAB_CONTENT_SELECTOR } from "@/features/native/native-tab-config";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  defaultPreload: "intent",
  routeTree,
  scrollRestoration: true,
  scrollToTopSelectors: [NATIVE_TAB_CONTENT_SELECTOR],
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
