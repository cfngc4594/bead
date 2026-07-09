import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export function NativeBackHandler() {
  const router = useRouter();
  const matchRoute = useMatchRoute();
  const isNewProjectRoute = matchRoute({ to: "/projects/new" }) !== false;
  const isProjectEditorRoute =
    matchRoute({ to: "/projects/$projectId" }) !== false;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listener = App.addListener("backButton", () => {
      if (isNewProjectRoute || isProjectEditorRoute) {
        router.navigate({ to: "/projects", replace: true });
        return;
      }

      App.exitApp();
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [isNewProjectRoute, isProjectEditorRoute, router]);

  return null;
}
