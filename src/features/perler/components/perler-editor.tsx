"use client";

import { useState } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import {
  type GridCell,
  PerlerCanvas,
} from "@/features/perler/components/perler-canvas";
import { PerlerDesktopColorSidebar } from "@/features/perler/components/perler-desktop-color-sidebar";
import { PerlerMobileColorPanel } from "@/features/perler/components/perler-mobile-color-panel";
import { PerlerToolbar } from "@/features/perler/components/perler-toolbar";
import { useBeadHistory } from "@/features/perler/hooks/use-bead-history";
import type { CanvasTool } from "@/features/perler/types";

type PerlerEditorProps = {
  size: CanvasSize;
};

const colorLetters = Array.from(
  new Set(mardColors.map((color) => color.code[0])),
);

export function PerlerEditor({ size }: PerlerEditorProps) {
  const [selectedColor, setSelectedColor] = useState(mardColors[0]);
  const [selectedLetter, setSelectedLetter] = useState(selectedColor.code[0]);
  const [tool, setTool] = useState<CanvasTool>("pan");
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const {
    beads,
    beginEdit,
    editCell: setCell,
    commitEdit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBeadHistory(size.rows * size.cols);

  const filteredColors = mardColors.filter((color) =>
    color.code.startsWith(selectedLetter),
  );

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

  return (
    <main className="grid h-screen min-w-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-background md:grid-cols-[1fr_280px] md:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col">
        <PerlerToolbar
          canRedo={canRedo}
          canUndo={canUndo}
          onRedo={redo}
          onResetView={() => setResetViewSignal((value) => value + 1)}
          onSelectTool={setTool}
          onUndo={undo}
          tool={tool}
        />

        <div className="min-h-0 flex-1 overflow-hidden bg-muted/30">
          <PerlerCanvas
            rows={size.rows}
            cols={size.cols}
            beads={beads}
            tool={tool}
            onEditCell={editCell}
            onEditEnd={commitEdit}
            onEditStart={beginEdit}
            onPickCell={pickCell}
            resetViewSignal={resetViewSignal}
          />
        </div>
      </section>

      <PerlerDesktopColorSidebar
        colors={filteredColors}
        letters={colorLetters}
        onSelectColor={setSelectedColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
      <PerlerMobileColorPanel
        colors={filteredColors}
        letters={colorLetters}
        onSelectColor={setSelectedColor}
        onSelectLetter={setSelectedLetter}
        selectedColor={selectedColor}
        selectedLetter={selectedLetter}
      />
    </main>
  );
}
