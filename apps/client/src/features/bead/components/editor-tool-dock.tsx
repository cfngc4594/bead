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
  drawTriggerDefinition,
  getDrawTriggerDefinition,
  isBeadFillModeEnabled,
  isDrawTool,
  panToolDefinition,
  parseCanvasTool,
  resolveCanvasTool,
  selectToolDefinition,
} from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

const mainTools = [panToolDefinition, selectToolDefinition] as const;

type EditorToolDockProps = {
  tool: CanvasTool;
  flyoutOpen: boolean;
  onFlyoutOpenChange: (open: boolean) => void;
  onSelectTool: (tool: CanvasTool) => void;
  className?: string;
};

export function EditorToolDock({
  tool,
  flyoutOpen,
  onFlyoutOpenChange,
  onSelectTool,
  className,
}: EditorToolDockProps) {
  const isDrawToolActive = isDrawTool(tool);
  const drawSelection = isDrawToolActive ? parseCanvasTool(tool) : null;
  const beadFillEnabled = drawSelection
    ? isBeadFillModeEnabled(drawSelection.instrument)
    : false;
  const drawTriggerIcon = drawSelection
    ? getDrawTriggerDefinition(
        drawSelection.instrument,
        drawSelection.beadFillMode,
      )
    : drawTriggerDefinition;

  function applyDrawSelection(
    instrument: DrawInstrument,
    fillMode: BeadFillMode = drawSelection?.beadFillMode ?? "normal",
  ) {
    onSelectTool(resolveCanvasTool(instrument, fillMode));
  }

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
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        {flyoutOpen && drawSelection ? (
          <div
            className={cn(
              editorToolSurfaceClassName,
              "flex items-center gap-1.5 duration-200 animate-in fade-in slide-in-from-bottom-2",
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
                  beadFillEnabled &&
                  drawSelection.beadFillMode === definition.id
                }
                key={definition.id}
                label={definition.label}
                onClick={() => applyDrawSelection("brush", definition.id)}
              />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            editorToolSurfaceClassName,
            "flex items-center gap-1.5",
          )}
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
      </div>
    </div>
  );
}
