import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { BeadColorGrid } from "@/features/bead/components/bead-color-grid";
import { BeadColorLetterIndex } from "@/features/bead/components/bead-color-letter-index";
import { BeadCurrentColor } from "@/features/bead/components/bead-current-color";

type BeadDesktopColorSidebarProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function BeadDesktopColorSidebar({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
}: BeadDesktopColorSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <BeadCurrentColor color={selectedColor} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[44px_1fr] overflow-hidden">
        <BeadColorLetterIndex
          letters={letters}
          onSelectLetter={onSelectLetter}
          orientation="vertical"
          selectedLetter={selectedLetter}
        />

        <ScrollArea className="h-full min-h-0">
          <BeadColorGrid
            colors={colors}
            layout="desktop"
            onSelectColor={onSelectColor}
            selectedColor={selectedColor}
          />
        </ScrollArea>
      </div>
    </aside>
  );
}
