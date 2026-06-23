import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { ColorGrid } from "@/features/bead/components/color-grid";
import { ColorLetterIndex } from "@/features/bead/components/color-letter-index";
import { CurrentColor } from "@/features/bead/components/current-color";

type DesktopColorSidebarProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function DesktopColorSidebar({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
}: DesktopColorSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <CurrentColor color={selectedColor} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[48px_minmax(0,1fr)] overflow-hidden">
        <ColorLetterIndex
          letters={letters}
          onSelectLetter={onSelectLetter}
          orientation="vertical"
          selectedLetter={selectedLetter}
        />

        <ScrollArea className="h-full min-h-0">
          <ColorGrid
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
