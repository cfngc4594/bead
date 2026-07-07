import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import {
  createBeadImageBlob,
  exportBeadImage,
} from "@/features/bead/lib/export-image";
import { exportBeadTemplate } from "@/features/bead/lib/export-template";
import { generateBeadsFromImageFile } from "@/features/bead/lib/image-to-beads";
import {
  BeadTemplateImportError,
  parseBeadTemplateFile,
} from "@/features/bead/lib/import-template";
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = useState(mardColors[0]);
  const [selectedLetter, setSelectedLetter] = useState(selectedColor.code[0]);
  const [tool, setTool] = useState<CanvasTool>("pan");
  const [showBeadCodes, setShowBeadCodes] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false);

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

  async function exportImage() {
    if (isExportingImage) {
      return;
    }

    const loadingToastId = toast.loading("正在生成图片...");
    setIsExportingImage(true);
    trackEvent("image_export_started", getImageExportProperties());

    try {
      await waitForNextFrame();
      await exportBeadImage({
        rows: size.rows,
        cols: size.cols,
        beads,
        filename: `bead-${size.id}.png`,
        showBeadCodes,
        showGuideLines,
      });
      trackEvent("image_export_succeeded", getImageExportProperties());
      toast.dismiss(loadingToastId);
    } catch (error) {
      console.error("Unable to export image", error);
      trackEvent("image_export_failed", getImageExportProperties());
      toast.error("导出图片失败", { id: loadingToastId });
    } finally {
      setIsExportingImage(false);
    }
  }

  async function createExportImageBlob() {
    if (isExportingImage) {
      return null;
    }

    setIsExportingImage(true);
    trackEvent("image_export_started", {
      ...getImageExportProperties(),
      destination: "android_sheet",
    });

    try {
      await waitForNextFrame();
      const blob = await createBeadImageBlob({
        rows: size.rows,
        cols: size.cols,
        beads,
        showBeadCodes,
        showGuideLines,
      });

      trackEvent("image_export_succeeded", {
        ...getImageExportProperties(),
        destination: "android_sheet",
      });
      return blob;
    } catch (error) {
      console.error("Unable to create export image", error);
      trackEvent("image_export_failed", {
        ...getImageExportProperties(),
        destination: "android_sheet",
      });
      toast.error("图片生成失败");
      return null;
    } finally {
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

  function importImage() {
    if (isGeneratingFromImage) {
      return;
    }

    imageInputRef.current?.click();
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
          : "导入模板失败。",
      );
    }
  }

  async function importImageFile(file: File) {
    setIsGeneratingFromImage(true);
    trackEvent("image_import_started", getCanvasSizeProperties());

    try {
      const generatedBeads = await generateBeadsFromImageFile({
        cols: size.cols,
        file,
        palette: mardColors,
        rows: size.rows,
      });

      resetSelection();
      commitBeads(generatedBeads);
      trackEvent("image_import_succeeded", getCanvasSizeProperties());
      toast.success("图片已生成豆图");
    } catch (error) {
      console.error("Unable to generate bead image", error);
      trackEvent("image_import_failed", getCanvasSizeProperties());
      toast.error("图片生成失败");
    } finally {
      setIsGeneratingFromImage(false);
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

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    void importImageFile(file);
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
    return {
      ...getCanvasProperties(),
      showBeadCodes,
      showGuideLines,
    };
  }

  return {
    handleImageFileChange,
    handleImportFileChange,
    imageInputRef,
    importInputRef,
    isExportingImage,
    isGeneratingFromImage,
    resetViewAfterResizeSignal,
    resetViewSignal,
    selectedColor,
    selectedLetter,
    selectionResetSignal,
    setResetViewAfterResizeSignal,
    setResetViewSignal,
    selectColor,
    setSelectedLetter,
    setShowBeadCodes,
    setShowGuideLines,
    showBeadCodes,
    showGuideLines,
    tool,
    actions: {
      clearDraft,
      createExportImageBlob,
      exportImage,
      exportTemplate,
      importImage,
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
