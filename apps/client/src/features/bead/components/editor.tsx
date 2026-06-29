"use client";

import { Capacitor } from "@capacitor/core";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import { BeadModelPreview } from "@/features/bead/components/bead-model-preview";
import type { CanvasBoardProps } from "@/features/bead/components/canvas";
import { DesktopColorSidebar } from "@/features/bead/components/desktop-color-sidebar";
import { CanvasBoardSkeleton } from "@/features/bead/components/editor-skeleton";
import { ExportImageSheet } from "@/features/bead/components/export-image-sheet";
import { LayersPanel } from "@/features/bead/components/layers-panel";
import { MobileColorPanel } from "@/features/bead/components/mobile-color-panel";
import { EditorToolbar } from "@/features/bead/components/toolbar";
import { useEditorActions } from "@/features/bead/hooks/use-editor-actions";
import { useMixedBeadBrush } from "@/features/bead/hooks/use-mixed-bead-brush";
import { useModelPreview } from "@/features/bead/hooks/use-model-preview";
import { useProjectCanvas } from "@/features/bead/hooks/use-project-canvas";
import {
  addLayer as addDocumentLayer,
  deleteLayer as deleteDocumentLayer,
  getVisibleBeads,
  renameLayer as renameDocumentLayer,
  reorderLayer as reorderDocumentLayer,
  selectLayer as selectDocumentLayer,
  toggleLayerHidden as toggleDocumentLayerHidden,
  toggleLayerLocked as toggleDocumentLayerLocked,
} from "@/features/bead/lib/canvas-document";
import {
  type ProjectId,
  renameProject as renameStoredProject,
} from "@/features/bead/storage/projects";
import type { GridCell } from "@/features/bead/types";

const CanvasBoard = dynamic<CanvasBoardProps>(
  () =>
    import("@/features/bead/components/canvas").then(
      (module) => module.CanvasBoard,
    ),
  {
    loading: () => <CanvasBoardSkeleton />,
    ssr: false,
  },
);

type EditorProps = {
  projectId: ProjectId;
  size: CanvasSize;
  title: string;
};

const colorLetters = Array.from(
  new Set(mardColors.map((color) => color.code[0])),
);

export function Editor({ projectId, size, title }: EditorProps) {
  return (
    <EditorContent
      key={projectId}
      projectId={projectId}
      size={size}
      title={title}
    />
  );
}

function EditorContent({ projectId, size, title }: EditorProps) {
  const router = useRouter();
  const modelPreview = useModelPreview();
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [exportImageBlob, setExportImageBlob] = useState<Blob | null>(null);
  const {
    beads,
    activeLayerId,
    beginEdit,
    editCell: setCell,
    commitEdit,
    commitBeads,
    commitDocument,
    document,
    layers,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  } = useProjectCanvas({ projectId, size });
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
  const exportImageFilename = `bead-${size.id}.png`;
  const visibleBeads = getVisibleBeads(document);

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
  }

  function pickCell({ row, column }: GridCell) {
    const bead = visibleBeads[row * size.cols + column];

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

  function moveSelection(nextDocument: typeof document) {
    commitDocument(nextDocument);
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
    if (Capacitor.getPlatform() !== "android") {
      actions.exportImage();
      return;
    }

    setExportImageBlob(null);
    setIsExportSheetOpen(true);
    createExportImage();
  }

  function selectLayer(layerId: string) {
    const nextDocument = selectDocumentLayer(document, layerId);
    actions.resetSelection();
    commitDocument(nextDocument);
  }

  function addLayer() {
    actions.resetSelection();
    commitDocument(addDocumentLayer(document));
  }

  function renameLayer(layerId: string, name: string) {
    commitDocument(renameDocumentLayer({ document, layerId, name }));
  }

  function deleteLayer(layerId: string) {
    actions.resetSelection();
    commitDocument(deleteDocumentLayer(document, layerId));
  }

  function reorderLayer(fromIndex: number, toIndex: number) {
    actions.resetSelection();
    commitDocument(reorderDocumentLayer({ document, fromIndex, toIndex }));
  }

  function toggleLayerHidden(layerId: string) {
    actions.resetSelection();
    commitDocument(toggleDocumentLayerHidden(document, layerId));
  }

  function toggleLayerLocked(layerId: string) {
    actions.resetSelection();
    commitDocument(toggleDocumentLayerLocked(document, layerId));
  }

  return (
    <main className="grid h-screen min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <EditorToolbar
          canClear={hasBeads}
          canRedo={canRedo}
          canUndo={canUndo}
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
          onBack={() => router.push("/projects")}
          onRenameProject={handleRenameProject}
          onSelectTool={actions.selectTool}
          onToggleBeadCodes={() => setShowBeadCodes((value) => !value)}
          onToggleGuideLines={() => setShowGuideLines((value) => !value)}
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
              beads={visibleBeads}
              cols={size.cols}
              resetViewSignal={resetViewSignal}
              rows={size.rows}
            />
          ) : (
            <CanvasBoard
              rows={size.rows}
              cols={size.cols}
              beads={visibleBeads}
              document={document}
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
          )}
          {!modelPreview.isOpen ? (
            <LayersPanel
              activeLayerId={activeLayerId}
              layers={layers}
              onAddLayer={addLayer}
              onDeleteLayer={deleteLayer}
              onRenameLayer={renameLayer}
              onReorderLayer={reorderLayer}
              onSelectLayer={selectLayer}
              onToggleLayerHidden={toggleLayerHidden}
              onToggleLayerLocked={toggleLayerLocked}
            />
          ) : null}
        </div>
      </section>

      <DesktopColorSidebar
        colors={filteredColors}
        letters={colorLetters}
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
      <MobileColorPanel
        colors={filteredColors}
        letters={colorLetters}
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
