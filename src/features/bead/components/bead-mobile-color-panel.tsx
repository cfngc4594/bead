"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { BeadColorGrid } from "@/features/bead/components/bead-color-grid";
import { BeadColorLetterIndex } from "@/features/bead/components/bead-color-letter-index";
import { BeadCurrentColor } from "@/features/bead/components/bead-current-color";
import { cn } from "@/lib/utils";

type BeadMobileColorPanelProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
  onResetView: () => void;
};

export function BeadMobileColorPanel({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
  onResetView,
}: BeadMobileColorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      className={cn(
        "flex min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden",
        isExpanded ? "h-[330px] max-h-[50vh]" : "h-14",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 shrink-0 items-center justify-between gap-3 px-4",
          isExpanded ? "h-14 border-b" : "h-14",
        )}
      >
        <BeadCurrentColor color={selectedColor} />
        <Button
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "折叠颜色面板" : "展开颜色面板"}
          className="shrink-0 text-muted-foreground"
          onClick={() => {
            setIsExpanded((value) => !value);
            onResetView();
          }}
          size="icon"
          type="button"
          variant="outline"
        >
          {isExpanded ? (
            <ChevronDown aria-hidden="true" className="size-4" />
          ) : (
            <ChevronUp aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>

      {isExpanded ? (
        <>
          <div className="min-w-0 shrink-0 border-b">
            <BeadColorLetterIndex
              letters={letters}
              onSelectLetter={onSelectLetter}
              orientation="horizontal"
              selectedLetter={selectedLetter}
            />
          </div>

          <ScrollArea className="min-h-0 flex-1 overscroll-contain **:data-[slot=scroll-area-scrollbar]:hidden">
            <BeadColorGrid
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
