import { getMardColor, mardColors } from "@bead/core/colors";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { BeadModelPreview } from "@/features/bead/components/bead-model-preview";
import { DesktopEditorSidebar } from "@/features/bead/components/desktop-editor-sidebar";
import { EditorToolDock } from "@/features/bead/components/editor-tool-dock";
import { ExportImagePanel } from "@/features/bead/components/export-image-panel";
import { LazyCanvasBoard } from "@/features/bead/components/lazy-canvas-board";
import { MobileEditorPanel } from "@/features/bead/components/mobile-editor-panel";
import { EditorToolbar } from "@/features/bead/components/toolbar";
import { useBeadImageExport } from "@/features/bead/hooks/use-bead-image-export";
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
  const {
    beads,
    beginEdit,
    editCells: setCells,
    commitEdit,
    commitBeads,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  } = useProjectCanvas({ projectId, size });
  const exportImage = useBeadImageExport({
    beads,
    cols: size.cols,
    rows: size.rows,
    sizeId: size.id,
    source: "editor",
  });
  const modelPreview = useModelPreview({
    onClose: () => trackEvent("model_preview_closed", getCanvasProperties()),
    onError: () => trackEvent("model_preview_failed", getCanvasProperties()),
    onOpen: () => trackEvent("model_preview_opened", getCanvasProperties()),
  });
  const {
    actions,
    aiImageInputRef,
    algorithmImageInputRef,
    handleAiImageFileChange,
    handleAlgorithmImageFileChange,
    handleImportFileChange,
    importInputRef,
    isGeneratingAiImage,
    isGeneratingAlgorithmImage,
    resetViewAfterResizeSignal,
    resetViewSignal,
    selectedColor,
    selectedLetter,
    selectionResetSignal,
    setResetViewSignal,
    setSelectedLetter,
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

  function beginCellEdit() {
    if (tool === "mix") {
      mixedBeadBrush.beginStroke();
    }

    beginEdit();
  }

  function editCells(cells: readonly GridCell[]) {
    const edits = cells.map(({ row, column }) => {
      const index = row * size.cols + column;
      const fill = getEditFill(index);

      mixedBeadBrush.commitCell(index, fill);

      return { index, fill };
    });

    setCells(edits);
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

    const color = getMardColor(bead.code);

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
    <main className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbar
          canClear={hasBeads}
          canRedo={canRedo}
          canUndo={canUndo}
          isModelPreviewOpen={modelPreview.isOpen}
          isPreparingModelPreview={modelPreview.isPreparing}
          projectTitle={title}
          onRedo={actions.redoEdit}
          onPreviewModel={modelPreview.toggle}
          onResetView={() => setResetViewSignal((value) => value + 1)}
          onClearDraft={actions.clearDraft}
          onExportImage={exportImage.openPanel}
          onExportTemplate={actions.exportTemplate}
          onImportAiImage={actions.importAiImage}
          onImportAlgorithmImage={actions.importAlgorithmImage}
          onImportTemplate={actions.importTemplate}
          onBack={onBack}
          onRenameProject={handleRenameProject}
          onUndo={actions.undoEdit}
          isExportingImage={exportImage.isEncoding}
          isGeneratingAiImage={isGeneratingAiImage}
          isGeneratingAlgorithmImage={isGeneratingAlgorithmImage}
        />
        <ExportImagePanel
          displayOptions={exportImage.displayOptions}
          filename={exportImage.filename}
          image={exportImage.image}
          isEncoding={exportImage.isEncoding}
          open={exportImage.isPanelOpen}
          onCreatePng={exportImage.createPngBlob}
          onDisplayOptionsChange={exportImage.changeDisplayOptions}
          onOpenChange={exportImage.changePanelOpen}
          onPrepareImage={exportImage.prepareImage}
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
          onChange={handleAiImageFileChange}
          ref={aiImageInputRef}
          type="file"
        />
        <input
          accept="image/*"
          className="hidden"
          onChange={handleAlgorithmImageFileChange}
          ref={algorithmImageInputRef}
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
            <>
              <LazyCanvasBoard
                mode="editable"
                rows={size.rows}
                cols={size.cols}
                beads={beads}
                tool={tool}
                onEditCells={editCells}
                onEditEnd={finishCellEdit}
                onEditStart={beginCellEdit}
                onMoveSelection={moveSelection}
                onPickCell={pickCell}
                selectionResetSignal={selectionResetSignal}
                resetViewAfterResizeSignal={resetViewAfterResizeSignal}
                resetViewSignal={resetViewSignal}
              />
              <EditorToolDock
                className="hidden md:flex"
                layout="desktop"
                onSelectTool={actions.selectTool}
                tool={tool}
              />
            </>
          )}
        </div>
      </section>

      <DesktopEditorSidebar
        colors={filteredColors}
        letters={colorLetters}
        modelPreviewControls={modelPreviewControls}
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
      <MobileEditorPanel
        colors={filteredColors}
        letters={colorLetters}
        onSelectTool={actions.selectTool}
        modelPreviewControls={modelPreviewControls}
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
        tool={tool}
      />
    </main>
  );
}
