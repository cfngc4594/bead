import {
  type BeadImageDisplayOptions,
  type BeadImageSvg,
  type BeadImageSvgRenderer,
  defaultBeadImageDisplayOptions,
} from "@bead/core/bead-image-svg";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import {
  createBeadImagePngBlob,
  prepareBeadImage,
} from "@/features/bead/lib/export-image";
import { getFilledCellCount, trackEvent } from "@/lib/analytics";

type UseBeadImageExportOptions = {
  beads: CanvasState;
  cols: number;
  filename?: string;
  rows: number;
  sizeId: string;
  source: "discover" | "editor";
};

export function useBeadImageExport({
  beads,
  cols,
  filename,
  rows,
  sizeId,
  source,
}: UseBeadImageExportOptions) {
  const rendererRef = useRef<BeadImageSvgRenderer | null>(null);
  const isExportingImageRef = useRef(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [image, setImage] = useState<BeadImageSvg | null>(null);
  const [displayOptions, setDisplayOptions] = useState<BeadImageDisplayOptions>(
    defaultBeadImageDisplayOptions,
  );
  const [isEncoding, setIsEncoding] = useState(false);

  function getCanvasProperties() {
    return {
      cols,
      filledCells: getFilledCellCount(beads),
      rows,
      sizeId,
      source,
    };
  }

  function prepareImage(options: BeadImageDisplayOptions) {
    try {
      rendererRef.current ??= prepareBeadImage({
        beads,
        cols,
        rows,
      });
      setImage(rendererRef.current.render(options));
    } catch (error) {
      console.error("Unable to prepare export image", error);
      setImage(null);
      toast.error("预览生成失败");
    }
  }

  function openPanel() {
    rendererRef.current = null;
    setImage(null);
    setIsPanelOpen(true);
    trackEvent("export_image_panel_opened", getCanvasProperties());
    prepareImage(displayOptions);
  }

  function changePanelOpen(open: boolean) {
    setIsPanelOpen(open);

    if (!open) {
      rendererRef.current = null;
      setImage(null);
    }
  }

  function changeDisplayOptions(options: BeadImageDisplayOptions) {
    setDisplayOptions(options);
    prepareImage(options);
  }

  async function createPngBlob(nextImage: BeadImageSvg) {
    if (isExportingImageRef.current) {
      return null;
    }

    isExportingImageRef.current = true;
    setIsEncoding(true);
    trackEvent("image_export_started", {
      ...getCanvasProperties(),
      ...nextImage.displayOptions,
      destination: "export_panel",
    });

    try {
      await waitForNextFrame();
      const blob = await createBeadImagePngBlob(nextImage);
      trackEvent("image_export_succeeded", {
        ...getCanvasProperties(),
        ...nextImage.displayOptions,
        destination: "export_panel",
      });
      return blob;
    } catch (error) {
      console.error("Unable to create export image", error);
      trackEvent("image_export_failed", {
        ...getCanvasProperties(),
        ...nextImage.displayOptions,
        destination: "export_panel",
      });
      toast.error("图片生成失败");
      return null;
    } finally {
      isExportingImageRef.current = false;
      setIsEncoding(false);
    }
  }

  return {
    displayOptions,
    filename: filename ?? `bead-${sizeId}.png`,
    image,
    isEncoding,
    isPanelOpen,
    changeDisplayOptions,
    changePanelOpen,
    createPngBlob,
    openPanel,
    prepareImage,
  };
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
