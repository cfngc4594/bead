import { cn } from "@bead/ui/lib/utils";
import { EditorToolButton } from "@/features/bead/components/editor-tool-button";
import {
  drawTriggerDefinition,
  getDrawTriggerDefinition,
  isDrawTool,
  panToolDefinition,
  parseCanvasTool,
  selectToolDefinition,
} from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

type MobileEditorToolDockProps = {
  tool: CanvasTool;
  flyoutOpen: boolean;
  onFlyoutOpenChange: (open: boolean) => void;
  onSelectTool: (tool: CanvasTool) => void;
  className?: string;
};

const mainTools = [panToolDefinition, selectToolDefinition] as const;

export function MobileEditorToolDock({
  tool,
  flyoutOpen,
  onFlyoutOpenChange,
  onSelectTool,
  className,
}: MobileEditorToolDockProps) {
  const isDrawToolActive = isDrawTool(tool);
  const drawSelection = isDrawToolActive ? parseCanvasTool(tool) : null;
  const drawTriggerIcon = drawSelection
    ? getDrawTriggerDefinition(
        drawSelection.instrument,
        drawSelection.beadFillMode,
      )
    : drawTriggerDefinition;

  function activateDrawEntry() {
    if (!isDrawToolActive) {
      onSelectTool("paint");
      onFlyoutOpenChange(true);
      return;
    }

    onFlyoutOpenChange(!flyoutOpen);
  }

  function selectMainTool(nextTool: CanvasTool) {
    onFlyoutOpenChange(false);
    onSelectTool(nextTool);
  }

  return (
    <div
      className={cn("flex shrink-0 items-center gap-1.5", className)}
      role="toolbar"
      aria-label="画布工具"
    >
      {mainTools.map((definition) => (
        <EditorToolButton
          icon={definition.icon}
          isActive={tool === definition.tool}
          key={definition.tool}
          label={definition.label}
          onClick={() => selectMainTool(definition.tool)}
        />
      ))}
      <EditorToolButton
        ariaExpanded={isDrawToolActive ? flyoutOpen : undefined}
        icon={drawTriggerIcon.icon}
        isActive={isDrawToolActive}
        key={
          drawSelection
            ? `${drawSelection.instrument}-${drawSelection.beadFillMode}`
            : "draw-entry"
        }
        label={drawTriggerIcon.label}
        onClick={activateDrawEntry}
      />
    </div>
  );
}
