import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { BeadColorGrid } from "@/features/bead/components/bead-color-grid";
import { BeadColorLetterIndex } from "@/features/bead/components/bead-color-letter-index";
import { BeadCurrentColor } from "@/features/bead/components/bead-current-color";

type BeadMobileColorPanelProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function BeadMobileColorPanel({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
}: BeadMobileColorPanelProps) {
  return (
    <section className="flex h-[330px] max-h-[50vh] min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <BeadCurrentColor color={selectedColor} />
      </div>

      <div className="min-w-0 shrink-0 border-b">
        <BeadColorLetterIndex
          letters={letters}
          onSelectLetter={onSelectLetter}
          orientation="horizontal"
          selectedLetter={selectedLetter}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <BeadColorGrid
          colors={colors}
          layout="mobile"
          onSelectColor={onSelectColor}
          selectedColor={selectedColor}
        />
      </ScrollArea>
    </section>
  );
}
