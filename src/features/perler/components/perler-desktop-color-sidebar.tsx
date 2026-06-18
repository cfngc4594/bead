import { ScrollArea } from "@/components/ui/scroll-area";
import type { BeadColor } from "@/data/colors";
import { PerlerColorGrid } from "@/features/perler/components/perler-color-grid";
import { PerlerColorLetterIndex } from "@/features/perler/components/perler-color-letter-index";
import { PerlerCurrentColor } from "@/features/perler/components/perler-current-color";

type PerlerDesktopColorSidebarProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function PerlerDesktopColorSidebar({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  onSelectColor,
  onSelectLetter,
}: PerlerDesktopColorSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <PerlerCurrentColor color={selectedColor} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[44px_1fr] overflow-hidden">
        <PerlerColorLetterIndex
          letters={letters}
          onSelectLetter={onSelectLetter}
          orientation="vertical"
          selectedLetter={selectedLetter}
        />

        <ScrollArea className="h-full min-h-0">
          <PerlerColorGrid
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
