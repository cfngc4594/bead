import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NativeBackHandler } from "@/features/native/native-back-handler";
import "@/styles/globals.css";
import { api } from "@/lib/api";

console.log((await api.health.$get()).status);

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <NativeBackHandler />
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster position="top-right" />
    </>
  );
}
