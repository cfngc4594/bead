"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function NativeBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditorRoute =
    pathname === "/projects" && searchParams.has("projectId");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (pathname === "/projects/new" || isEditorRoute) {
        router.replace("/projects");
        return;
      }

      if (canGoBack) {
        window.history.back();
        return;
      }

      App.exitApp();
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [isEditorRoute, pathname, router]);

  return null;
}
