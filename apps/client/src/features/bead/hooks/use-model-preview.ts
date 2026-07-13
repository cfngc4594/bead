import { useState } from "react";
import { toast } from "sonner";
import { preloadBeadModelScene } from "@/features/bead/lib/bead-model-scene-loader";
import {
  defaultModelPreviewSettings,
  type ModelPreviewMode,
  type ModelPreviewSettings,
} from "@/features/bead/lib/model-preview-config";

type UseModelPreviewProps = {
  onClose?: () => void;
  onError?: () => void;
  onOpen?: () => void;
};

export function useModelPreview({
  onClose,
  onError,
  onOpen,
}: UseModelPreviewProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [mode, setMode] = useState<ModelPreviewMode>("beads");
  const [settings, setSettings] = useState<ModelPreviewSettings>(
    defaultModelPreviewSettings,
  );
  const isPreparing = status === "loading";

  function close() {
    setIsOpen(false);
    onClose?.();
  }

  function open() {
    if (status === "ready") {
      setIsOpen(true);
      onOpen?.();
      return;
    }

    setStatus("loading");

    preloadBeadModelScene()
      .then(() => {
        setStatus("ready");
        setIsOpen(true);
        onOpen?.();
      })
      .catch((error) => {
        setStatus("idle");
        console.error("Unable to load bead model preview", error);
        onError?.();
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
    mode,
    setMode,
    settings,
    setSettings,
    toggle,
  };
}
