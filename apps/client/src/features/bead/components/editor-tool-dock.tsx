import { cn } from "@bead/ui/lib/utils";
import { DrawToolOptions } from "@/features/bead/components/draw-tool-options";
import { EditorMainTools } from "@/features/bead/components/editor-main-tools";
import { editorToolSurfaceClassName } from "@/features/bead/components/editor-tool-button";
import type { DrawToolController } from "@/features/bead/hooks/use-draw-tool-controller";
import type { CanvasTool } from "@/features/bead/types";

type EditorToolDockProps = {
  className?: string;
  controller: DrawToolController;
  tool: CanvasTool;
};

export function EditorToolDock({
  className,
  controller,
  tool,
}: EditorToolDockProps) {
  const { applyDrawSelection, beadFillEnabled, drawSelection, flyoutOpen } =
    controller;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        {flyoutOpen && drawSelection ? (
          <DrawToolOptions
            beadFillEnabled={beadFillEnabled}
            beadFillMode={drawSelection.beadFillMode}
            instrument={drawSelection.instrument}
            onSelect={applyDrawSelection}
          />
        ) : null}

        <div
          className={cn(
            editorToolSurfaceClassName,
            "flex items-center gap-1.5",
          )}
          role="toolbar"
          aria-label="画布工具"
        >
          <EditorMainTools controller={controller} tool={tool} />
        </div>
      </div>
    </div>
  );
}
