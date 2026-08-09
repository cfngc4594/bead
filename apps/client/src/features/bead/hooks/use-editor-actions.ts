import type { BeadImageDisplayOptions } from "@bead/core/bead-image-svg";
import { mardColors } from "@bead/core/colors";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { startAiImageJob, waitForAiImageJob } from "@/features/bead/api/ai-api";
import { canvasSnapshotToBeads } from "@/features/bead/lib/canvas-snapshot-to-beads";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import { createBeadImageBlob } from "@/features/bead/lib/export-image";
import { exportBeadTemplate } from "@/features/bead/lib/export-template";
import { generateBeadsFromImageFile } from "@/features/bead/lib/image-to-beads";
import {
  BeadTemplateImportError,
  parseBeadTemplateFile,
} from "@/features/bead/lib/import-template";
import { prepareAiUploadFile } from "@/features/bead/lib/prepare-ai-upload-file";
import type { CanvasTool } from "@/features/bead/types";
import { getFilledCellCount, trackEvent } from "@/lib/analytics";

type UseEditorActionsProps = {
  beads: CanvasState;
  commitBeads: (beads: CanvasState) => void;
  size: CanvasSize;
  onClear: () => void;
  onRedo: () => void;
  onUndo: () => void;
};

export function useEditorActions({
  beads,
  commitBeads,
  size,
  onClear,
  onRedo,
  onUndo,
}: UseEditorActionsProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);
  const algorithmImageInputRef = useRef<HTMLInputElement>(null);
  const activeImageJobRef = useRef<AbortController | null>(null);
  const isExportingImageRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState(mardColors[0]);
  const [selectedLetter, setSelectedLetter] = useState(selectedColor.code[0]);
  const [tool, setTool] = useState<CanvasTool>("pan");
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [isGeneratingAlgorithmImage, setIsGeneratingAlgorithmImage] =
    useState(false);
  const isGeneratingFromImage =
    isGeneratingAiImage || isGeneratingAlgorithmImage;

  useEffect(
    () => () => {
      activeImageJobRef.current?.abort();
    },
    [],
  );

  function resetSelection() {
    setSelectionResetSignal((value) => value + 1);
  }

  function selectTool(nextTool: CanvasTool) {
    if (nextTool !== tool) {
      trackEvent("tool_selected", {
        sizeId: size.id,
        tool: nextTool,
      });
      resetSelection();
    }

    setTool(nextTool);
  }

  function selectColor(color: (typeof mardColors)[number]) {
    setSelectedColor(color);
    setSelectedLetter(color.code[0]);
  }

  function clearDraft() {
    resetSelection();
    onClear();
    trackEvent("canvas_cleared", getCanvasProperties());
  }

  function undoEdit() {
    resetSelection();
    onUndo();
    trackEvent("undo_used", getCanvasProperties());
  }

  function redoEdit() {
    resetSelection();
    onRedo();
    trackEvent("redo_used", getCanvasProperties());
  }

  async function createExportImageBlob(
    displayOptions: BeadImageDisplayOptions,
  ) {
    if (isExportingImageRef.current) {
      return null;
    }

    isExportingImageRef.current = true;
    setIsExportingImage(true);
    trackEvent("image_export_started", {
      ...getImageExportProperties(),
      ...displayOptions,
      destination: "export_panel",
    });

    try {
      await waitForNextFrame();
      const blob = await createBeadImageBlob({
        rows: size.rows,
        cols: size.cols,
        beads,
        displayOptions,
      });

      trackEvent("image_export_succeeded", {
        ...getImageExportProperties(),
        ...displayOptions,
        destination: "export_panel",
      });
      return blob;
    } catch (error) {
      console.error("Unable to create export image", error);
      trackEvent("image_export_failed", {
        ...getImageExportProperties(),
        ...displayOptions,
        destination: "export_panel",
      });
      toast.error("图片生成失败");
      return null;
    } finally {
      isExportingImageRef.current = false;
      setIsExportingImage(false);
    }
  }

  function exportTemplate() {
    trackEvent("template_export_started", getCanvasProperties());
    exportBeadTemplate({
      size,
      beads,
      filename: `bead-${size.id}.bead.json`,
    })
      .then(() => {
        trackEvent("template_export_succeeded", getCanvasProperties());
      })
      .catch((error) => {
        console.error("Unable to export template", error);
        trackEvent("template_export_failed", getCanvasProperties());
        toast.error("导出模板失败");
      });
  }

  function importTemplate() {
    importInputRef.current?.click();
  }

  function importAiImage() {
    if (isGeneratingFromImage) {
      return;
    }

    aiImageInputRef.current?.click();
  }

  function importAlgorithmImage() {
    if (isGeneratingFromImage) {
      return;
    }

    algorithmImageInputRef.current?.click();
  }

  async function importTemplateFile(file: File) {
    trackEvent("template_import_started", getCanvasSizeProperties());

    try {
      const importedBeads = parseBeadTemplateFile({
        text: await file.text(),
        size,
      });

      resetSelection();
      commitBeads(importedBeads);
      trackEvent("template_import_succeeded", getCanvasSizeProperties());
      toast.success("模板已导入");
    } catch (error) {
      trackEvent("template_import_failed", getCanvasSizeProperties());
      toast.error(
        error instanceof BeadTemplateImportError
          ? error.message
          : "导入模板失败",
      );
    }
  }

  async function importAiImageFile(file: File) {
    activeImageJobRef.current?.abort();
    const controller = new AbortController();
    activeImageJobRef.current = controller;
    setIsGeneratingAiImage(true);
    trackEvent("image_import_started", {
      ...getCanvasSizeProperties(),
      method: "ai",
    });
    const loadingToastId = toast.loading("正在 AI 生成豆图...");

    try {
      const uploadFile = await prepareAiUploadFile(file);
      const jobId = await startAiImageJob({
        file: uploadFile,
        sizeId: size.id,
      });
      const snapshot = await waitForAiImageJob(jobId, {
        signal: controller.signal,
      });
      const generatedBeads = canvasSnapshotToBeads(
        snapshot,
        size.rows * size.cols,
      );

      resetSelection();
      commitBeads(generatedBeads);
      trackEvent("image_import_succeeded", {
        ...getCanvasSizeProperties(),
        method: "ai",
      });
      toast.success("AI 豆图已生成", { id: loadingToastId });
    } catch (error) {
      if (controller.signal.aborted) {
        toast.dismiss(loadingToastId);
        return;
      }
      console.error("Unable to generate bead image", error);
      trackEvent("image_import_failed", {
        ...getCanvasSizeProperties(),
        method: "ai",
      });
      toast.error(error instanceof Error ? error.message : "图片生成失败", {
        id: loadingToastId,
      });
    } finally {
      if (activeImageJobRef.current === controller) {
        activeImageJobRef.current = null;
        if (!controller.signal.aborted) {
          setIsGeneratingAiImage(false);
        }
      }
    }
  }

  async function importAlgorithmImageFile(file: File) {
    setIsGeneratingAlgorithmImage(true);
    trackEvent("image_import_started", {
      ...getCanvasSizeProperties(),
      method: "algorithm",
    });
    const loadingToastId = toast.loading("正在用算法生成豆图...");

    try {
      await waitForNextFrame();
      const generatedBeads = await generateBeadsFromImageFile({
        cols: size.cols,
        file,
        palette: mardColors,
        rows: size.rows,
      });

      resetSelection();
      commitBeads(generatedBeads);
      trackEvent("image_import_succeeded", {
        ...getCanvasSizeProperties(),
        method: "algorithm",
      });
      toast.success("算法豆图已生成", { id: loadingToastId });
    } catch (error) {
      console.error(
        "Unable to generate bead image with local algorithm",
        error,
      );
      trackEvent("image_import_failed", {
        ...getCanvasSizeProperties(),
        method: "algorithm",
      });
      toast.error("算法生成失败，请更换图片后重试", {
        id: loadingToastId,
      });
    } finally {
      setIsGeneratingAlgorithmImage(false);
    }
  }

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void importTemplateFile(file);
  }

  function handleAiImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void importAiImageFile(file);
  }

  function handleAlgorithmImageFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void importAlgorithmImageFile(file);
  }

  function getCanvasSizeProperties() {
    return getCanvasSizePropertiesFor(size);
  }

  function getCanvasProperties() {
    return {
      ...getCanvasSizeProperties(),
      filledCells: getFilledCellCount(beads),
    };
  }

  function getImageExportProperties() {
    return getCanvasProperties();
  }

  return {
    aiImageInputRef,
    algorithmImageInputRef,
    handleAiImageFileChange,
    handleAlgorithmImageFileChange,
    handleImportFileChange,
    importInputRef,
    isExportingImage,
    isGeneratingAiImage,
    isGeneratingAlgorithmImage,
    resetViewAfterResizeSignal,
    resetViewSignal,
    selectedColor,
    selectedLetter,
    selectionResetSignal,
    setResetViewAfterResizeSignal,
    setResetViewSignal,
    selectColor,
    setSelectedLetter,
    tool,
    actions: {
      clearDraft,
      createExportImageBlob,
      exportTemplate,
      importAiImage,
      importAlgorithmImage,
      importTemplate,
      redoEdit,
      resetSelection,
      selectColor,
      selectTool,
      undoEdit,
    },
  };
}

function getCanvasSizePropertiesFor(size: CanvasSize) {
  return {
    cols: size.cols,
    rows: size.rows,
    sizeId: size.id,
  };
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
