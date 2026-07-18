import { Toaster } from "@bead/ui/components/sonner";
import { TooltipProvider } from "@bead/ui/components/tooltip";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { NativeBackHandler } from "@/features/native/native-back-handler";
import { NativeSafeAreaViewport } from "@/features/native/native-safe-area";
import { initAnalytics } from "@/lib/analytics";
import "@/styles/globals.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <>
      <NativeBackHandler />
      <TooltipProvider>
        <NativeSafeAreaViewport>
          <Outlet />
        </NativeSafeAreaViewport>
      </TooltipProvider>
      <Toaster position="top-right" />
    </>
  );
}
