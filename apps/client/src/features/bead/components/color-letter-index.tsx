import { Button } from "@bead/ui/components/button";
import {
  ScrollArea,
  ScrollAreaViewport,
  ScrollBar,
} from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { useEffect, useRef } from "react";
import { getCenteredScrollOffset } from "@/features/bead/lib/centered-scroll-offset";

type ColorLetterIndexProps = {
  centerSelectedLetterSignal: number;
  letters: readonly string[];
  selectedLetter: string;
  orientation: "horizontal" | "vertical";
  onSelectLetter: (letter: string) => void;
};

export function ColorLetterIndex({
  centerSelectedLetterSignal,
  letters,
  selectedLetter,
  orientation,
  onSelectLetter,
}: ColorLetterIndexProps) {
  const isHorizontal = orientation === "horizontal";
  const viewportRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (centerSelectedLetterSignal === 0) {
      return;
    }

    const viewport = viewportRef.current;
    const selectedButton = selectedButtonRef.current;

    if (!viewport || !selectedButton) {
      return;
    }

    const viewportSize = isHorizontal
      ? viewport.clientWidth
      : viewport.clientHeight;

    if (viewportSize === 0) {
      return;
    }

    const targetOffset = getCenteredScrollOffset({
      itemOffset: isHorizontal
        ? selectedButton.offsetLeft
        : selectedButton.offsetTop,
      itemSize: isHorizontal
        ? selectedButton.offsetWidth
        : selectedButton.offsetHeight,
      scrollSize: isHorizontal ? viewport.scrollWidth : viewport.scrollHeight,
      viewportSize,
    });
    const currentOffset = isHorizontal
      ? viewport.scrollLeft
      : viewport.scrollTop;

    if (Math.abs(targetOffset - currentOffset) < 1) {
      return;
    }

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";

    viewport.scrollTo(
      isHorizontal
        ? { behavior, left: targetOffset }
        : { behavior, top: targetOffset },
    );
  }, [centerSelectedLetterSignal, isHorizontal]);

  if (isHorizontal) {
    return (
      <ScrollAreaPrimitive.Root
        className="relative min-w-0 overflow-hidden"
        data-slot="scroll-area"
      >
        <ScrollAreaPrimitive.Viewport
          className="w-full min-w-0 whitespace-nowrap outline-none"
          data-slot="scroll-area-viewport"
          ref={viewportRef}
        >
          <div className="flex w-max flex-row gap-1 p-2">
            {letters.map((letter) => (
              <Button
                aria-label={`显示 ${letter} 色系`}
                className="shrink-0 text-xs"
                key={letter}
                onClick={() => onSelectLetter(letter)}
                ref={selectedLetter === letter ? selectedButtonRef : undefined}
                size="icon"
                variant={selectedLetter === letter ? "default" : "ghost"}
              >
                {letter}
              </Button>
            ))}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar className="hidden" orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }

  return (
    <ScrollArea
      className={cn(
        "h-full min-h-0 border-r",
        "**:data-[slot=scroll-area-scrollbar]:hidden",
      )}
    >
      <ScrollAreaViewport ref={viewportRef}>
        <div className="flex flex-col gap-1 p-2">
          {letters.map((letter) => (
            <Button
              aria-label={`显示 ${letter} 色系`}
              className="w-full text-xs"
              key={letter}
              onClick={() => onSelectLetter(letter)}
              ref={selectedLetter === letter ? selectedButtonRef : undefined}
              size="icon"
              variant={selectedLetter === letter ? "default" : "ghost"}
            >
              {letter}
            </Button>
          ))}
        </div>
      </ScrollAreaViewport>
    </ScrollArea>
  );
}
