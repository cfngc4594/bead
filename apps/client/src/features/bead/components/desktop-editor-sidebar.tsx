import type { BeadColor } from "@bead/core/colors";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Rotate3D } from "lucide-react";
import { ColorGrid } from "@/features/bead/components/color-grid";
import { ColorLetterIndex } from "@/features/bead/components/color-letter-index";
import { CurrentColor } from "@/features/bead/components/current-color";
import {
  ModelPreviewControls,
  type ModelPreviewControlsBinding,
} from "@/features/bead/components/model-preview-controls";

type DesktopEditorSidebarProps = {
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  modelPreviewControls: ModelPreviewControlsBinding | null;
  onSelectColor: (color: BeadColor) => void;
  onSelectLetter: (letter: string) => void;
};

export function DesktopEditorSidebar({
  letters,
  colors,
  selectedColor,
  selectedLetter,
  modelPreviewControls,
  onSelectColor,
  onSelectLetter,
}: DesktopEditorSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-l bg-card md:flex">
      {modelPreviewControls ? (
        <>
          <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Rotate3D aria-hidden="true" className="size-4" />
            </span>
            <p className="min-w-0 text-sm font-medium">3D 预览</p>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ModelPreviewControls
              {...modelPreviewControls}
              className="p-4"
              layout="desktop"
            />
          </ScrollArea>
        </>
      ) : (
        <>
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
        </>
      )}
    </aside>
  );
}
