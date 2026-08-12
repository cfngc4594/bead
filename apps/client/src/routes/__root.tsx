import { Toaster } from "@bead/ui/components/sonner";
import { TooltipProvider } from "@bead/ui/components/tooltip";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppThemeProvider, useAppTheme } from "@/components/theme-provider";
import { NativeBackHandler } from "@/features/native/native-back-handler";
import { NativeSafeAreaViewport } from "@/features/native/native-safe-area";
import { initAnalytics } from "@/lib/analytics";
import type { RouterContext } from "@/lib/router-context";
import "@/styles/globals.css";

const TOASTER_SAFE_AREA_OFFSET = {
  top: "calc(1rem + env(safe-area-inset-top, 0px))",
  right: "calc(1rem + env(safe-area-inset-right, 0px))",
  bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
  left: "calc(1rem + env(safe-area-inset-left, 0px))",
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <AppThemeProvider>
      <RootContent />
    </AppThemeProvider>
  );
}

function RootContent() {
  const { resolvedTheme } = useAppTheme();

  return (
    <>
      <NativeBackHandler />
      <TooltipProvider>
        <NativeSafeAreaViewport>
          <Outlet />
        </NativeSafeAreaViewport>
      </TooltipProvider>
      <Toaster
        mobileOffset={TOASTER_SAFE_AREA_OFFSET}
        offset={TOASTER_SAFE_AREA_OFFSET}
        position="top-right"
        theme={resolvedTheme}
      />
    </>
  );
}
