import { Button } from "@bead/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import { cn } from "@bead/ui/lib/utils";
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

const mobileMainTools = [panToolDefinition, selectToolDefinition] as const;

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
      {mobileMainTools.map((definition) => (
        <MobileToolButton
          definition={definition}
          isActive={tool === definition.tool}
          key={definition.tool}
          onClick={() => selectMainTool(definition.tool)}
        />
      ))}
      <MobileToolButton
        definition={drawTriggerIcon}
        isActive={isDrawToolActive}
        ariaExpanded={isDrawToolActive ? flyoutOpen : undefined}
        key={
          drawSelection
            ? `${drawSelection.instrument}-${drawSelection.beadFillMode}`
            : "draw-entry"
        }
        onClick={activateDrawEntry}
      />
    </div>
  );
}

function MobileToolButton({
  definition,
  isActive,
  ariaExpanded,
  onClick,
}: {
  definition: {
    label: string;
    icon: typeof panToolDefinition.icon;
  };
  isActive: boolean;
  ariaExpanded?: boolean;
  onClick: () => void;
}) {
  const Icon = definition.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-expanded={ariaExpanded}
          aria-label={definition.label}
          aria-pressed={isActive}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block">
        {definition.label}
      </TooltipContent>
    </Tooltip>
  );
}
