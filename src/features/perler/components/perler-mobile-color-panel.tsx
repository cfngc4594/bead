import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { PerlerColorGrid } from "@/features/perler/components/perler-color-grid";
import { PerlerColorLetterIndex } from "@/features/perler/components/perler-color-letter-index";
import { PerlerCurrentColor } from "@/features/perler/components/perler-current-color";

type PerlerMobileColorPanelProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function PerlerMobileColorPanel({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
}: PerlerMobileColorPanelProps) {
  return (
    <section className="flex h-[330px] max-h-[50vh] min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <PerlerCurrentColor color={selectedColor} />
      </div>

      <div className="min-w-0 shrink-0 border-b">
        <PerlerColorLetterIndex
          letters={letters}
          onSelectLetter={onSelectLetter}
          orientation="horizontal"
          selectedLetter={selectedLetter}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <PerlerColorGrid
          colors={colors}
          layout="mobile"
          onSelectColor={onSelectColor}
          selectedColor={selectedColor}
        />
      </ScrollArea>
    </section>
  );
}
