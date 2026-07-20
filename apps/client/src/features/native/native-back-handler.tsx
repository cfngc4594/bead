import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { consumeNativeBack } from "@/features/native/native-back-store";
import {
  appSecondaryTabs,
  appStartTab,
} from "@/features/navigation/tab-config";

export function NativeBackHandler() {
  const router = useRouter();
  const matchRoute = useMatchRoute();
  const isNewProjectRoute =
    matchRoute({ to: "/projects/new", fuzzy: false }) !== false;
  const isProjectEditorRoute =
    matchRoute({ to: "/projects/$projectId", fuzzy: false }) !== false;
  const isSecondaryTabRoute = appSecondaryTabs.some(
    ({ to }) => matchRoute({ to, fuzzy: false }) !== false,
  );
  const shouldReturnToStartTab =
    isNewProjectRoute || isProjectEditorRoute || isSecondaryTabRoute;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listener = App.addListener("backButton", () => {
      if (consumeNativeBack()) {
        return;
      }

      if (shouldReturnToStartTab) {
        router.navigate({ to: appStartTab.to, replace: true });
        return;
      }

      App.exitApp();
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [router, shouldReturnToStartTab]);

  return null;
}
