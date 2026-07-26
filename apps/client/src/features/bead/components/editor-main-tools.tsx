import { EditorToolButton } from "@/features/bead/components/editor-tool-button";
import type { DrawToolController } from "@/features/bead/hooks/use-draw-tool-controller";
import { mainToolDefinitions } from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

export function EditorMainTools({
  controller,
  tool,
}: {
  controller: DrawToolController;
  tool: CanvasTool;
}) {
  const {
    activateDrawEntry,
    drawSelection,
    drawTrigger,
    flyoutOpen,
    isDrawToolActive,
    selectMainTool,
  } = controller;

  return (
    <>
      {mainToolDefinitions.map((definition) => (
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
        icon={drawTrigger.icon}
        isActive={isDrawToolActive}
        key={
          drawSelection
            ? `${drawSelection.instrument}-${drawSelection.beadFillMode}`
            : "draw-entry"
        }
        label={drawTrigger.label}
        onClick={activateDrawEntry}
      />
    </>
  );
}
