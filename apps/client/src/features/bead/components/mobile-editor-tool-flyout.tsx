import { cn } from "@bead/ui/lib/utils";
import {
  EditorToolButton,
  editorToolSurfaceClassName,
} from "@/features/bead/components/editor-tool-button";
import {
  type BeadFillMode,
  beadFillModeDefinitions,
  type DrawInstrument,
  drawInstrumentDefinitions,
  isBeadFillModeEnabled,
  isDrawTool,
  parseCanvasTool,
  resolveCanvasTool,
} from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

type MobileEditorToolFlyoutProps = {
  open: boolean;
  tool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  className?: string;
};

export function MobileEditorToolFlyout({
  open,
  tool,
  onSelectTool,
  className,
}: MobileEditorToolFlyoutProps) {
  if (!open || !isDrawTool(tool)) {
    return null;
  }

  const drawSelection = parseCanvasTool(tool);
  const beadFillEnabled = isBeadFillModeEnabled(drawSelection.instrument);

  function applyDrawSelection(
    instrument: DrawInstrument,
    fillMode: BeadFillMode = drawSelection.beadFillMode,
  ) {
    onSelectTool(resolveCanvasTool(instrument, fillMode));
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-end px-4 md:hidden",
        className,
      )}
    >
      <div
        className={cn(
          editorToolSurfaceClassName,
          "pointer-events-auto flex items-center gap-1.5 duration-200 animate-in fade-in slide-in-from-bottom-2",
        )}
        role="toolbar"
        aria-label="绘制选项"
      >
        {drawInstrumentDefinitions.map((definition) => (
          <EditorToolButton
            icon={definition.icon}
            isActive={drawSelection.instrument === definition.id}
            key={definition.id}
            label={definition.label}
            onClick={() => applyDrawSelection(definition.id)}
          />
        ))}
        {beadFillModeDefinitions.map((definition) => (
          <EditorToolButton
            disabled={!beadFillEnabled}
            icon={definition.icon}
            isActive={
              beadFillEnabled && drawSelection.beadFillMode === definition.id
            }
            key={definition.id}
            label={definition.label}
            onClick={() => applyDrawSelection("brush", definition.id)}
          />
        ))}
      </div>
    </div>
  );
}
