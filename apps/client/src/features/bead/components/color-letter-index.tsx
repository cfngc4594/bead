import { Button } from "@bead/ui/components/button";
import { ScrollArea, ScrollBar } from "@bead/ui/components/scroll-area";
import { cn } from "@bead/ui/lib/utils";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

type ColorLetterIndexProps = {
  letters: readonly string[];
  selectedLetter: string;
  orientation: "horizontal" | "vertical";
  onSelectLetter: (letter: string) => void;
};

export function ColorLetterIndex({
  letters,
  selectedLetter,
  orientation,
  onSelectLetter,
}: ColorLetterIndexProps) {
  const isHorizontal = orientation === "horizontal";

  if (isHorizontal) {
    return (
      <ScrollAreaPrimitive.Root
        className="relative min-w-0 overflow-hidden"
        data-slot="scroll-area"
      >
        <ScrollAreaPrimitive.Viewport
          className="w-full min-w-0 whitespace-nowrap outline-none"
          data-slot="scroll-area-viewport"
        >
          <div className="flex w-max flex-row gap-1 p-2">
            {letters.map((letter) => (
              <Button
                aria-label={`显示 ${letter} 色系`}
                className="shrink-0 text-xs"
                key={letter}
                onClick={() => onSelectLetter(letter)}
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
      <div className="flex flex-col gap-1 p-2">
        {letters.map((letter) => (
          <Button
            aria-label={`显示 ${letter} 色系`}
            className="w-full text-xs"
            key={letter}
            onClick={() => onSelectLetter(letter)}
            size="icon"
            variant={selectedLetter === letter ? "default" : "ghost"}
          >
            {letter}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
