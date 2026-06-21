"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import type { BeadCanvasProps } from "@/features/bead/components/bead-canvas";
import { BeadDesktopColorSidebar } from "@/features/bead/components/bead-desktop-color-sidebar";
import { BeadCanvasSkeleton } from "@/features/bead/components/bead-editor-skeleton";
import { BeadMobileColorPanel } from "@/features/bead/components/bead-mobile-color-panel";
import { BeadToolbar } from "@/features/bead/components/bead-toolbar";
import { useBeadSnapshots } from "@/features/bead/hooks/use-bead-snapshots";
import { exportBeadImage } from "@/features/bead/lib/export-image";
import { exportBeadTemplate } from "@/features/bead/lib/export-template";
import {
  BeadTemplateImportError,
  parseBeadTemplateFile,
} from "@/features/bead/lib/import-template";
import {
  type BeadDocumentId,
  renameBeadDocument,
} from "@/features/bead/storage/bead-documents";
import type { CanvasTool, GridCell } from "@/features/bead/types";

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
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = useState(mardColors[0]);
  const [selectedLetter, setSelectedLetter] = useState(selectedColor.code[0]);
  const [tool, setTool] = useState<CanvasTool>("pan");
  const [showBeadCodes, setShowBeadCodes] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [resetViewAfterResizeSignal, setResetViewAfterResizeSignal] =
    useState(0);
  const [selectionResetSignal, setSelectionResetSignal] = useState(0);
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

  const filteredColors = mardColors.filter((color) =>
    color.code.startsWith(selectedLetter),
  );
  const hasBeads = beads.some(Boolean);

  function resetSelection() {
    setSelectionResetSignal((value) => value + 1);
  }

  function selectTool(nextTool: CanvasTool) {
    if (nextTool !== tool) {
      resetSelection();
    }

    setTool(nextTool);
  }

  function clearDraft() {
    resetSelection();
    clear();
  }

  function undoEdit() {
    resetSelection();
    undo();
  }

  function redoEdit() {
    resetSelection();
    redo();
  }

  function exportImage() {
    exportBeadImage({
      rows: size.rows,
      cols: size.cols,
      beads,
      filename: `bead-${size.id}.png`,
      showBeadCodes,
      showGuideLines,
    });
  }

  function exportTemplate() {
    exportBeadTemplate({
      size,
      beads,
      filename: `bead-${size.id}.bead.json`,
    });
  }

  function importTemplate() {
    importInputRef.current?.click();
  }

  async function importTemplateFile(file: File) {
    try {
      const importedBeads = parseBeadTemplateFile({
        text: await file.text(),
        size,
      });

      resetSelection();
      commitBeads(importedBeads);
      toast.success("模板已导入");
    } catch (error) {
      toast.error(
        error instanceof BeadTemplateImportError
          ? error.message
          : "导入模板失败。",
      );
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

    setSelectedColor(color);
    setSelectedLetter(color.code[0]);
    setTool("paint");
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
          onRedo={redoEdit}
          onResetView={() => setResetViewSignal((value) => value + 1)}
          onClearDraft={clearDraft}
          onExportImage={exportImage}
          onExportTemplate={exportTemplate}
          onImportTemplate={importTemplate}
          onBack={() => router.push("/projects")}
          onRenameProject={renameProject}
          onSelectTool={selectTool}
          onToggleBeadCodes={() => setShowBeadCodes((value) => !value)}
          onToggleGuideLines={() => setShowGuideLines((value) => !value)}
          onUndo={undoEdit}
          tool={tool}
        />
        <input
          accept=".bead.json,application/json"
          className="hidden"
          onChange={handleImportFileChange}
          ref={importInputRef}
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
        onSelectColor={setSelectedColor}
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
        onSelectColor={setSelectedColor}
        onSelectLetter={setSelectedLetter}
        onSelectTool={selectTool}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
        tool={tool}
      />
    </main>
  );
}
