"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";

export function useModelPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const isPreparing = status === "loading";

  useEffect(() => {
    let isMounted = true;

    preloadBeadModelScene()
      .then(() => {
        if (isMounted) {
          setStatus("ready");
        }
      })
      .catch((error) => {
        console.error("Unable to preload bead model preview", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function close() {
    setIsOpen(false);
  }

  function open() {
    if (status === "ready") {
      setIsOpen(true);
      return;
    }

    setStatus("loading");

    preloadBeadModelScene()
      .then(() => {
        setStatus("ready");
        setIsOpen(true);
      })
      .catch((error) => {
        setStatus("idle");
        console.error("Unable to load bead model preview", error);
        toast.error("3D 预览加载失败");
      });
  }

  function toggle() {
    if (isOpen) {
      close();
      return;
    }

    open();
  }

  return {
    isOpen,
    isPreparing,
    toggle,
  };
}
