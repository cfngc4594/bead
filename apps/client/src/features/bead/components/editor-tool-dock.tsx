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

const dockSurfaceBaseClassName =
  "border border-border/80 bg-background shadow-md";

const mainDockSurfaceClassName = cn(
  dockSurfaceBaseClassName,
  "h-12 rounded-xl p-2",
);

const flyoutSurfaceClassName = cn(
  dockSurfaceBaseClassName,
  "h-10 rounded-lg p-2",
);

type EditorToolDockProps = {
  tool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  className?: string;
};

export function EditorToolDock({
  tool,
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
    if (isDrawToolActive) {
      return;
    }

    onSelectTool("paint");
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-auto relative">
        {drawSelection ? (
          <div
            className={cn(
              flyoutSurfaceClassName,
              "absolute bottom-full right-6 mb-2 flex translate-x-1/2 items-center gap-2 duration-200 animate-in fade-in slide-in-from-bottom-2",
            )}
            role="toolbar"
            aria-label="绘制选项"
          >
            <fieldset
              aria-label="绘制工具"
              className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
            >
              {drawInstrumentDefinitions.map((definition) => (
                <DockToolButton
                  definition={definition}
                  isActive={drawSelection.instrument === definition.id}
                  key={definition.id}
                  onClick={() => applyDrawSelection(definition.id)}
                  size="flyout"
                />
              ))}
            </fieldset>

            <DockDivider size="flyout" />

            <fieldset
              aria-label="豆型"
              className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
            >
              {beadFillModeDefinitions.map((definition) => (
                <DockToolButton
                  definition={definition}
                  disabled={!beadFillEnabled}
                  isActive={
                    beadFillEnabled &&
                    drawSelection.beadFillMode === definition.id
                  }
                  key={definition.id}
                  onClick={() => applyDrawSelection("brush", definition.id)}
                  size="flyout"
                />
              ))}
            </fieldset>
          </div>
        ) : null}

        <div
          className={cn(mainDockSurfaceClassName, "flex items-center gap-2")}
          role="toolbar"
          aria-label="画布工具"
        >
          <div className="flex items-center gap-2">
            <DockToolButton
              definition={panToolDefinition}
              isActive={tool === "pan"}
              onClick={() => onSelectTool("pan")}
              size="main"
            />
            <DockToolButton
              definition={selectToolDefinition}
              isActive={tool === "select"}
              onClick={() => onSelectTool("select")}
              size="main"
            />
          </div>

          <DockDivider size="main" />

          <DockToolButton
            definition={drawTriggerIcon}
            isActive={isDrawToolActive}
            key={
              drawSelection
                ? `${drawSelection.instrument}-${drawSelection.beadFillMode}`
                : "draw-entry"
            }
            onClick={activateDrawEntry}
            size="main"
          />
        </div>
      </div>
    </div>
  );
}

function DockDivider({ size }: { size: "main" | "flyout" }) {
  return (
    <div
      aria-hidden="true"
      className={cn("w-px shrink-0 bg-border", size === "main" ? "h-8" : "h-6")}
    />
  );
}

function DockToolButton({
  definition,
  isActive,
  disabled = false,
  label,
  onClick,
  size,
}: {
  definition: {
    label: string;
    icon: LucideIcon;
    id?: string;
  };
  isActive: boolean;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
  size: "main" | "flyout";
}) {
  const Icon = definition.icon;
  const tooltipLabel = label ?? definition.label;
  const isMain = size === "main";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={tooltipLabel}
          aria-pressed={isActive}
          className={cn(
            "shrink-0 rounded-md",
            isMain ? "size-8 p-1" : "size-6 p-1",
            isActive &&
              "border-border bg-muted text-foreground shadow-xs dark:border-input dark:bg-input/30",
          )}
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Icon className={isMain ? "size-4" : "size-3.5"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block" side="top">
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
