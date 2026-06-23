"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import type { BeadCanvasProps } from "@/features/bead/components/bead-canvas";
import { BeadDesktopColorSidebar } from "@/features/bead/components/bead-desktop-color-sidebar";
import { BeadCanvasSkeleton } from "@/features/bead/components/bead-editor-skeleton";
import { BeadMobileColorPanel } from "@/features/bead/components/bead-mobile-color-panel";
import { BeadToolbar } from "@/features/bead/components/bead-toolbar";
import { useBeadEditorActions } from "@/features/bead/hooks/use-bead-editor-actions";
import { useBeadSnapshots } from "@/features/bead/hooks/use-bead-snapshots";
import {
  type BeadDocumentId,
  renameBeadDocument,
} from "@/features/bead/storage/bead-documents";
import type { GridCell } from "@/features/bead/types";

const BeadCanvas = dynamic<BeadCanvasProps>(
  () =>
    import("@/features/bead/components/bead-canvas").then(
      (module) => module.BeadCanvas,
    ),
  {
    loading: () => <BeadCanvasSkeleton />,
    ssr: false,
  },
);

type BeadEditorProps = {
  documentId: BeadDocumentId;
  size: CanvasSize;
  title: string;
};

const colorLetters = Array.from(
  new Set(mardColors.map((color) => color.code[0])),
);

export function BeadEditor({ documentId, size, title }: BeadEditorProps) {
  return (
    <BeadEditorContent
      key={documentId}
      documentId={documentId}
      size={size}
      title={title}
    />
  );
}

function BeadEditorContent({ documentId, size, title }: BeadEditorProps) {
  const router = useRouter();
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
  } = useBeadSnapshots({ documentId, size });
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
  } = useBeadEditorActions({
    beads,
    commitBeads,
    size,
    onClear: clear,
    onRedo: redo,
    onUndo: undo,
  });

  const filteredColors = mardColors.filter((color) =>
    color.code.startsWith(selectedLetter),
  );
  const hasBeads = beads.some(Boolean);

  function editCell({ row, column }: GridCell) {
    const index = row * size.cols + column;

    setCell(
      index,
      tool === "erase"
        ? null
        : {
            code: selectedColor.code,
            hex: selectedColor.hex,
          },
    );
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

  function moveSelection(nextBeads: (typeof beads)[number][]) {
    commitBeads(nextBeads);
  }

  function renameProject(nextTitle: string) {
    renameBeadDocument({ documentId, title: nextTitle }).catch((error) => {
      console.error("Unable to rename bead document", error);
      toast.error("作品名保存失败");
    });
  }

  return (
    <main className="grid h-screen min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <BeadToolbar
          canClear={hasBeads}
          canRedo={canRedo}
          canUndo={canUndo}
          projectTitle={title}
          showBeadCodes={showBeadCodes}
          showGuideLines={showGuideLines}
          onRedo={actions.redoEdit}
          onResetView={() => setResetViewSignal((value) => value + 1)}
          onClearDraft={actions.clearDraft}
          onExportImage={actions.exportImage}
          onExportTemplate={actions.exportTemplate}
          onImportImage={actions.importImage}
          onImportTemplate={actions.importTemplate}
          onBack={() => router.push("/projects")}
          onRenameProject={renameProject}
          onSelectTool={actions.selectTool}
          onToggleBeadCodes={() => setShowBeadCodes((value) => !value)}
          onToggleGuideLines={() => setShowGuideLines((value) => !value)}
          onUndo={actions.undoEdit}
          isExportingImage={isExportingImage}
          isImportingImage={isGeneratingFromImage}
          tool={tool}
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

        <div className="min-h-0 flex-1 touch-none overflow-hidden overscroll-none bg-muted/30">
          <BeadCanvas
            rows={size.rows}
            cols={size.cols}
            beads={beads}
            tool={tool}
            showBeadCodes={showBeadCodes}
            showGuideLines={showGuideLines}
            onEditCell={editCell}
            onEditEnd={commitEdit}
            onEditStart={beginEdit}
            onMoveSelection={moveSelection}
            onPickCell={pickCell}
            selectionResetSignal={selectionResetSignal}
            resetViewAfterResizeSignal={resetViewAfterResizeSignal}
            resetViewSignal={resetViewSignal}
          />
        </div>
      </section>

      <BeadDesktopColorSidebar
        colors={filteredColors}
        letters={colorLetters}
        onSelectColor={actions.selectColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
      <BeadMobileColorPanel
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
