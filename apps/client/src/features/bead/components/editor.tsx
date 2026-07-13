import { Capacitor } from "@capacitor/core";
import {
  type ComponentType,
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import { BeadModelPreview } from "@/features/bead/components/bead-model-preview";
import type { CanvasBoardProps } from "@/features/bead/components/canvas";
import { DesktopColorSidebar } from "@/features/bead/components/desktop-color-sidebar";
import { CanvasBoardSkeleton } from "@/features/bead/components/editor-skeleton";
import { ExportImageSheet } from "@/features/bead/components/export-image-sheet";
import { MobileColorPanel } from "@/features/bead/components/mobile-color-panel";
import { EditorToolbar } from "@/features/bead/components/toolbar";
import { useEditorActions } from "@/features/bead/hooks/use-editor-actions";
import { useMixedBeadBrush } from "@/features/bead/hooks/use-mixed-bead-brush";
import { useModelPreview } from "@/features/bead/hooks/use-model-preview";
import { useProjectCanvas } from "@/features/bead/hooks/use-project-canvas";
import type { ModelPreviewMode } from "@/features/bead/lib/model-preview-config";
import {
  type ProjectId,
  renameProject as renameStoredProject,
} from "@/features/bead/storage/projects";
import type { GridCell } from "@/features/bead/types";
import { getFilledCellCount, trackEvent } from "@/lib/analytics";

const CanvasBoard = lazy(
  () =>
    import("@/features/bead/components/canvas").then((module) => ({
      default: module.CanvasBoard,
    })) as Promise<{
      default: ComponentType<CanvasBoardProps>;
    }>,
);

type EditorProps = {
  projectId: ProjectId;
  size: CanvasSize;
  title: string;
  onBack: () => void;
};

const colorLetters = Array.from(
  new Set(mardColors.map((color) => color.code[0])),
);

export function Editor({ projectId, size, title, onBack }: EditorProps) {
  return (
    <EditorContent
      key={projectId}
      projectId={projectId}
      size={size}
      title={title}
      onBack={onBack}
    />
  );
}

function EditorContent({ projectId, size, title, onBack }: EditorProps) {
  const hasTrackedCanvasEditRef = useRef(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [exportImageBlob, setExportImageBlob] = useState<Blob | null>(null);
  const {
    beads,
    beginEdit,
    editCell: setCell,
    commitEdit,
    commitBeads,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  } = useProjectCanvas({ projectId, size });
  const modelPreview = useModelPreview({
    onClose: () => trackEvent("model_preview_closed", getCanvasProperties()),
    onError: () => trackEvent("model_preview_failed", getCanvasProperties()),
    onOpen: () => trackEvent("model_preview_opened", getCanvasProperties()),
  });
  const {
    actions,
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
    setSelectedLetter,
    setShowBeadCodes,
    setShowGuideLines,
    showBeadCodes,
    showGuideLines,
    tool,
  } = useEditorActions({
    beads,
    commitBeads,
    size,
    onClear: clear,
    onRedo: redo,
    onUndo: undo,
  });
  const mixedBeadBrush = useMixedBeadBrush({ beads, size });

  const filteredColors = useMemo(
    () => mardColors.filter((color) => color.code.startsWith(selectedLetter)),
    [selectedLetter],
  );
  const hasBeads = beads.some(Boolean);
  const isExportImageSheetEnabled = Capacitor.getPlatform() === "android";
  const exportImageFilename = `bead-${size.id}.png`;

  function beginCellEdit() {
    if (tool === "mix") {
      mixedBeadBrush.beginStroke();
    }

    beginEdit();
  }

  function editCell({ row, column }: GridCell) {
    const index = row * size.cols + column;
    const fill = getEditFill(index);

    setCell(index, fill);
    mixedBeadBrush.commitCell(index, fill);
  }

  function getEditFill(index: number) {
    if (tool === "erase") {
      return null;
    }

    if (tool === "mix") {
      return mixedBeadBrush.pickFill(index);
    }

    return {
      code: selectedColor.code,
      hex: selectedColor.hex,
    };
  }

  function finishCellEdit() {
    mixedBeadBrush.endStroke();
    commitEdit();
    trackCanvasEditedOnce();
  }

  function pickCell({ row, column }: GridCell) {
    const bead = beads[row * size.cols + column];

    if (!bead) {
      return;
    }

    const color = mardColors.find((item) => item.code === bead.code);

    if (!color) {
      return;
    }

    actions.selectColor(color);
    actions.selectTool("paint");
  }

  function moveSelection(nextBeads: typeof beads) {
    commitBeads(nextBeads);
    trackCanvasEditedOnce();
  }

  function handleRenameProject(nextTitle: string) {
    renameStoredProject({ projectId, title: nextTitle }).catch((error) => {
      console.error("Unable to rename bead project", error);
      toast.error("作品名保存失败");
    });
  }

  function createExportImage() {
    actions.createExportImageBlob().then((blob) => {
      if (blob) {
        setExportImageBlob(blob);
      }
    });
  }

  function handleExportImage() {
    if (!isExportImageSheetEnabled) {
      actions.exportImage();
      return;
    }

    setExportImageBlob(null);
    setIsExportSheetOpen(true);
    trackEvent("android_export_sheet_opened", getCanvasProperties());
    createExportImage();
  }

  function toggleBeadCodes() {
    trackEvent("display_option_toggled", {
      ...getCanvasProperties(),
      enabled: !showBeadCodes,
      option: "bead_codes",
    });
    setShowBeadCodes((value) => !value);
  }

  function toggleGuideLines() {
    trackEvent("display_option_toggled", {
      ...getCanvasProperties(),
      enabled: !showGuideLines,
      option: "guide_lines",
    });
    setShowGuideLines((value) => !value);
  }

  function changeModelPreviewMode(mode: ModelPreviewMode) {
    modelPreview.setMode(mode);
    trackEvent("model_preview_mode_changed", {
      ...getCanvasProperties(),
      mode,
    });
  }

  function getCanvasProperties() {
    return {
      cols: size.cols,
      filledCells: getFilledCellCount(beads),
      rows: size.rows,
      sizeId: size.id,
    };
  }

  function trackCanvasEditedOnce() {
    if (hasTrackedCanvasEditRef.current) {
      return;
    }

    hasTrackedCanvasEditRef.current = true;
    trackEvent("canvas_edited", {
      ...getCanvasProperties(),
      tool,
    });
  }

  const modelPreviewControls = modelPreview.isOpen
    ? {
        mode: modelPreview.mode,
        onModeChange: changeModelPreviewMode,
        onSettingsChange: modelPreview.setSettings,
        settings: modelPreview.settings,
      }
    : null;

  return (
    <main className="grid h-svh min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbar
          canClear={hasBeads}
          canRedo={canRedo}
          canUndo={canUndo}
          isExportImageSheetEnabled={isExportImageSheetEnabled}
          isModelPreviewOpen={modelPreview.isOpen}
          isPreparingModelPreview={modelPreview.isPreparing}
          projectTitle={title}
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onRedo={actions.redoEdit}
          onPreviewModel={modelPreview.toggle}
          onResetView={() => setResetViewSignal((value) => value + 1)}
          onClearDraft={actions.clearDraft}
          onExportImage={handleExportImage}
          onExportTemplate={actions.exportTemplate}
          onImportImage={actions.importImage}
          onImportTemplate={actions.importTemplate}
          onBack={onBack}
          onRenameProject={handleRenameProject}
          onSelectTool={actions.selectTool}
          onToggleBeadCodes={toggleBeadCodes}
          onToggleGuideLines={toggleGuideLines}
          onUndo={actions.undoEdit}
          isExportingImage={isExportingImage}
          isImportingImage={isGeneratingFromImage}
          tool={tool}
        />
        <ExportImageSheet
          blob={exportImageBlob}
          filename={exportImageFilename}
          isCreating={isExportingImage}
          open={isExportSheetOpen}
          onCreateImage={createExportImage}
          onOpenChange={setIsExportSheetOpen}
        />
        <input
          accept=".bead.json,application/json"
          className="hidden"
          onChange={handleImportFileChange}
          ref={importInputRef}
          type="file"
        />
        <input
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
          ref={imageInputRef}
          type="file"
        />

        <div className="relative min-h-0 flex-1 overflow-hidden overscroll-none bg-muted/30">
          {modelPreview.isOpen ? (
            <BeadModelPreview
              beads={beads}
              cols={size.cols}
              mode={modelPreview.mode}
              resetViewSignal={resetViewSignal}
              rows={size.rows}
              settings={modelPreview.settings}
            />
          ) : (
            <Suspense fallback={<CanvasBoardSkeleton />}>
              <CanvasBoard
                rows={size.rows}
                cols={size.cols}
                beads={beads}
                tool={tool}
                showBeadCodes={showBeadCodes}
                showGuideLines={showGuideLines}
                onEditCell={editCell}
                onEditEnd={finishCellEdit}
                onEditStart={beginCellEdit}
                onMoveSelection={moveSelection}
                onPickCell={pickCell}
                selectionResetSignal={selectionResetSignal}
                resetViewAfterResizeSignal={resetViewAfterResizeSignal}
                resetViewSignal={resetViewSignal}
              />
            </Suspense>
          )}
        </div>
      </section>

      <DesktopColorSidebar
        colors={filteredColors}
        letters={colorLetters}
        modelPreviewControls={modelPreviewControls}
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
      <MobileColorPanel
        colors={filteredColors}
        letters={colorLetters}
        modelPreviewControls={modelPreviewControls}
        onResetViewAfterResize={() =>
          setResetViewAfterResizeSignal((value) => value + 1)
        }
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        onSelectTool={actions.selectTool}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
        tool={tool}
      />
    </main>
  );
}
