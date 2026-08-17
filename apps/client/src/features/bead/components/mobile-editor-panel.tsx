import type { BeadColor } from "@bead/core/colors";
import { ScrollArea } from "@bead/ui/components/scroll-area";
import { Rotate3D } from "lucide-react";
import { ColorGrid } from "@/features/bead/components/color-grid";
import { ColorLetterIndex } from "@/features/bead/components/color-letter-index";
import { CurrentColor } from "@/features/bead/components/current-color";
import { EditorToolDock } from "@/features/bead/components/editor-tool-dock";
import {
  ModelPreviewControls,
  type ModelPreviewControlsBinding,
} from "@/features/bead/components/model-preview-controls";
import type { CanvasTool } from "@/features/bead/types";

type MobileEditorPanelProps = {
  centerSelectedLetterSignal: number;
  letters: readonly string[];
  colors: readonly BeadColor[];
  selectedColor: BeadColor;
  selectedLetter: string;
  tool: CanvasTool;
  modelPreviewControls: ModelPreviewControlsBinding | null;
  onSelectColor: (color: BeadColor) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onSelectLetter: (letter: string) => void;
};

export function MobileEditorPanel({
  centerSelectedLetterSignal,
  letters,
  colors,
  selectedColor,
  selectedLetter,
  tool,
  modelPreviewControls,
  onSelectColor,
  onSelectTool,
  onSelectLetter,
}: MobileEditorPanelProps) {
  const isModelPreviewOpen = modelPreviewControls !== null;

  return (
    <section className="flex h-auto max-h-[50vh] min-w-0 shrink-0 flex-col overflow-hidden border-t bg-card md:hidden">
      <div className="flex h-14 min-h-0 shrink-0 items-center justify-between gap-3 border-b px-4">
        {isModelPreviewOpen ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Rotate3D aria-hidden="true" className="size-4" />
            </span>
            <p className="min-w-0 truncate text-sm font-medium">3D 预览</p>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <CurrentColor color={selectedColor} />
          </div>
        )}
        {isModelPreviewOpen ? null : (
          <div className="flex shrink-0 items-center gap-1.5">
            <EditorToolDock
              layout="mobile"
              onSelectTool={onSelectTool}
              tool={tool}
            />
          </div>
        )}
      </div>

      <div className="h-50 min-h-0">
        {isModelPreviewOpen ? (
          <ScrollArea className="h-full min-w-0 overflow-hidden overscroll-contain **:data-[slot=scroll-area-scrollbar]:hidden">
            <ModelPreviewControls
              {...modelPreviewControls}
              className="box-border w-screen max-w-[100vw] min-w-0 overflow-hidden p-4"
              layout="mobile"
            />
          </ScrollArea>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="relative h-12 min-w-0 shrink-0">
              <ColorLetterIndex
                centerSelectedLetterSignal={centerSelectedLetterSignal}
                letters={letters}
                onSelectLetter={onSelectLetter}
                orientation="horizontal"
                selectedLetter={selectedLetter}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
              />
            </div>

            <ScrollArea className="min-h-0 flex-1 overscroll-contain **:data-[slot=scroll-area-scrollbar]:hidden">
              <ColorGrid
                colors={colors}
                layout="mobile"
                onSelectColor={onSelectColor}
                selectedColor={selectedColor}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </section>
  );
}
