import { Button } from "@bead/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import { cn } from "@bead/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
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

const flyoutSurfaceClassName =
  "h-10 rounded-lg border border-border/80 bg-background p-2 shadow-md";

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
          flyoutSurfaceClassName,
          "pointer-events-auto flex items-center gap-2 duration-200 animate-in fade-in slide-in-from-bottom-2",
        )}
        role="toolbar"
        aria-label="绘制选项"
      >
        <fieldset
          aria-label="绘制工具"
          className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
        >
          {drawInstrumentDefinitions.map((definition) => (
            <FlyoutToolButton
              definition={definition}
              isActive={drawSelection.instrument === definition.id}
              key={definition.id}
              onClick={() => applyDrawSelection(definition.id)}
            />
          ))}
        </fieldset>

        <FlyoutDivider />

        <fieldset
          aria-label="豆型"
          className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
        >
          {beadFillModeDefinitions.map((definition) => (
            <FlyoutToolButton
              definition={definition}
              disabled={!beadFillEnabled}
              isActive={
                beadFillEnabled && drawSelection.beadFillMode === definition.id
              }
              key={definition.id}
              onClick={() => applyDrawSelection("brush", definition.id)}
            />
          ))}
        </fieldset>
      </div>
    </div>
  );
}

function FlyoutDivider() {
  return <div aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />;
}

function FlyoutToolButton({
  definition,
  isActive,
  disabled = false,
  onClick,
}: {
  definition: {
    label: string;
    icon: LucideIcon;
  };
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = definition.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={definition.label}
          aria-pressed={isActive}
          className={cn(
            "size-6 shrink-0 rounded-md p-1",
            isActive &&
              "border-border bg-muted text-foreground shadow-xs dark:border-input dark:bg-input/30",
          )}
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block">
        {definition.label}
      </TooltipContent>
    </Tooltip>
  );
}
