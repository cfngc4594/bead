import { Toaster } from "@bead/ui/components/sonner";
import { TooltipProvider } from "@bead/ui/components/tooltip";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { appConfig } from "@/config/app";
import { NativeBackHandler } from "@/features/native/native-back-handler";
import { NativeSafeAreaViewport } from "@/features/native/native-safe-area";
import { initAnalytics } from "@/lib/analytics";
import "@/styles/globals.css";

const TOASTER_SAFE_AREA_OFFSET = {
  top: "calc(1rem + env(safe-area-inset-top, 0px))",
  right: "calc(1rem + env(safe-area-inset-right, 0px))",
  bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
  left: "calc(1rem + env(safe-area-inset-left, 0px))",
};

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey={appConfig.themeStorageKey}>
      <RootContent />
    </ThemeProvider>
  );
}

function RootContent() {
  const { theme } = useTheme();

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
        theme={theme}
      />
    </>
  );
}
