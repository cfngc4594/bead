import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { ColorGrid } from "@/features/bead/components/color-grid";
import { ColorLetterIndex } from "@/features/bead/components/color-letter-index";
import { CurrentColor } from "@/features/bead/components/current-color";
import { ModeToolButtons } from "@/features/bead/components/mode-tool-buttons";
import type { CanvasTool } from "@/features/bead/types";
import { cn } from "@/lib/utils";

type MobileColorPanelProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  tool: CanvasTool;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onResetViewAfterResize: () => void;
};

export function MobileColorPanel({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  tool,
  onSelectColor,
  onSelectLetter,
  onSelectTool,
  onResetViewAfterResize,
}: MobileColorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      className={cn(
        "flex min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden",
        isExpanded ? "h-auto max-h-[50vh]" : "h-14",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 shrink-0 items-center justify-between gap-3 px-4",
          isExpanded ? "h-14 border-b" : "h-14",
        )}
      >
        <CurrentColor color={selectedColor} />
        <div className="flex shrink-0 items-center gap-1.5">
          <ModeToolButtons tool={tool} onSelectTool={onSelectTool} />
          <Button
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "折叠颜色面板" : "展开颜色面板"}
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
      ) : null}
    </section>
  );
}
