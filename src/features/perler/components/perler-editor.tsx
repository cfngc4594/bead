"use client";

import {
  Eraser,
  Focus,
  Hand,
  type LucideIcon,
  PenLine,
  Pipette,
  Redo2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import {
  type GridCell,
  PerlerCanvas,
} from "@/features/perler/components/perler-canvas";
import { useBeadHistory } from "@/features/perler/hooks/use-bead-history";
import { getReadableTextColor } from "@/features/perler/lib/color-utils";
import type { CanvasTool } from "@/features/perler/types";
import { cn } from "@/lib/utils";

type PerlerEditorProps = {
  size: CanvasSize;
};

type ToolbarIconButtonProps = {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isActive?: boolean;
  onClick: () => void;
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

  const usedCount = beads.reduce((count, bead) => count + (bead ? 1 : 0), 0);
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
    <main className="grid h-screen overflow-hidden grid-cols-[1fr_280px] bg-background">
      <section className="flex min-h-0 min-w-0 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <div>
            <h1 className="font-semibold text-base">拼豆编辑器</h1>
            <p className="text-muted-foreground text-xs">
              {size.title} · {usedCount}/{size.rows * size.cols}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              icon={Hand}
              isActive={tool === "pan"}
              label="移动"
              onClick={() => setTool("pan")}
            />
            <ToolbarIconButton
              icon={PenLine}
              isActive={tool === "paint"}
              label="画笔"
              onClick={() => setTool("paint")}
            />
            <ToolbarIconButton
              icon={Eraser}
              isActive={tool === "erase"}
              label="橡皮擦"
              onClick={() => setTool("erase")}
            />
            <ToolbarIconButton
              icon={Pipette}
              isActive={tool === "picker"}
              label="吸管"
              onClick={() => setTool("picker")}
            />
            <div className="mx-1 h-6 w-px bg-border" />
            <ToolbarIconButton
              icon={Focus}
              label="居中显示"
              onClick={() => setResetViewSignal((value) => value + 1)}
            />
            <div className="mx-1 h-6 w-px bg-border" />
            <ToolbarIconButton
              disabled={!canUndo}
              icon={Undo2}
              label="撤销"
              onClick={undo}
            />
            <ToolbarIconButton
              disabled={!canRedo}
              icon={Redo2}
              label="重做"
              onClick={redo}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden bg-muted/30">
          <PerlerCanvas
            rows={size.rows}
            cols={size.cols}
            beads={beads}
            selectedColor={selectedColor.hex}
            tool={tool}
            onEditCell={editCell}
            onEditEnd={commitEdit}
            onEditStart={beginEdit}
            onPickCell={pickCell}
            resetViewSignal={resetViewSignal}
          />
        </div>
      </section>

      <aside className="flex h-full min-h-0 flex-col border-l bg-card">
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <div className="flex items-center gap-3">
            <span
              className="size-8 rounded-full border"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <div className="min-w-0">
              <p className="font-medium text-sm">{selectedColor.code}</p>
              <p className="text-muted-foreground text-xs">
                {selectedColor.hex}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[44px_1fr] overflow-hidden">
          <ScrollArea className="h-full min-h-0 border-r **:data-[slot=scroll-area-scrollbar]:hidden">
            <div className="flex flex-col gap-1 p-2">
              {colorLetters.map((letter) => (
                <button
                  aria-label={`显示 ${letter} 色系`}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md font-medium text-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedLetter === letter &&
                      "bg-primary text-primary-foreground",
                  )}
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  type="button"
                >
                  {letter}
                </button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="h-full min-h-0">
            <div className="grid grid-cols-5 gap-2 p-4">
              {filteredColors.map((color) => {
                const isSelected = color.code === selectedColor.code;

                return (
                  <button
                    aria-label={`选择颜色 ${color.code}`}
                    className={cn(
                      "aspect-square rounded-md border font-semibold text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                    )}
                    key={color.code}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      backgroundColor: color.hex,
                      color: getReadableTextColor(color.hex),
                    }}
                    title={color.code}
                    type="button"
                  >
                    {color.code}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </main>
  );
}

function ToolbarIconButton({
  label,
  icon: Icon,
  disabled = false,
  isActive = false,
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={isActive || undefined}
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
