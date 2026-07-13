import { Button } from "@bead/ui/components/button";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { ChevronDown, ChevronUp, Rotate3D } from "lucide-react";
import { useState } from "react";
import type { BeadColor } from "@/data/colors";
import { ColorGrid } from "@/features/bead/components/color-grid";
import { ColorLetterIndex } from "@/features/bead/components/color-letter-index";
import { CurrentColor } from "@/features/bead/components/current-color";
import { ModeToolButtons } from "@/features/bead/components/mode-tool-buttons";
import {
  ModelPreviewControls,
  type ModelPreviewControlsBinding,
} from "@/features/bead/components/model-preview-controls";
import type { CanvasTool } from "@/features/bead/types";

type MobileEditorPanelProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  tool: CanvasTool;
  modelPreviewControls: ModelPreviewControlsBinding | null;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onResetViewAfterResize: () => void;
};

export function MobileEditorPanel({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  tool,
  modelPreviewControls,
  onSelectColor,
  onSelectLetter,
  onSelectTool,
  onResetViewAfterResize,
}: MobileEditorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isModelPreviewOpen = modelPreviewControls !== null;

  return (
    <section
      className={cn(
        "flex min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden",
        isExpanded
          ? isModelPreviewOpen
            ? "h-[50vh] max-h-[360px]"
            : "h-auto max-h-[50vh]"
          : "h-14",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 shrink-0 items-center justify-between gap-3 px-4",
          isExpanded ? "h-14 border-b" : "h-14",
        )}
      >
        {isModelPreviewOpen ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Rotate3D aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">3D 预览</p>
              <p className="truncate text-xs text-muted-foreground">
                烫法与材质设置
              </p>
            </div>
          </div>
        ) : (
          <CurrentColor color={selectedColor} />
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {isModelPreviewOpen ? null : (
            <ModeToolButtons tool={tool} onSelectTool={onSelectTool} />
          )}
          <Button
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? isModelPreviewOpen
                  ? "折叠 3D 设置面板"
                  : "折叠颜色面板"
                : isModelPreviewOpen
                  ? "展开 3D 设置面板"
                  : "展开颜色面板"
            }
            className="shrink-0"
            onClick={() => {
              setIsExpanded((value) => !value);
              onResetViewAfterResize();
            }}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" />
            ) : (
              <ChevronUp aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded ? (
        isModelPreviewOpen ? (
          <ScrollArea className="min-h-0 flex-1 overscroll-contain">
            <ModelPreviewControls
              {...modelPreviewControls}
              className="p-4"
              layout="mobile"
            />
          </ScrollArea>
        ) : (
          <>
            <div className="min-w-0 shrink-0 border-b">
              <ColorLetterIndex
                letters={letters}
                onSelectLetter={onSelectLetter}
                orientation="horizontal"
                selectedLetter={selectedLetter}
              />
            </div>

            <ScrollArea className="h-[calc(40px*3+8px*2+8px*2)] overscroll-contain **:data-[slot=scroll-area-scrollbar]:hidden">
              <ColorGrid
                colors={colors}
                layout="mobile"
                onSelectColor={onSelectColor}
                selectedColor={selectedColor}
              />
            </ScrollArea>
          </>
        )
      ) : null}
    </section>
  );
}
