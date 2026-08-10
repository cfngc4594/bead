import { cn } from "@bead/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  EditorToolButton,
  editorToolSurfaceClassName,
} from "@/features/bead/components/editor-tool-button";
import { canvasToolDefinitions } from "@/features/bead/lib/canvas-tool-definitions";
import {
  type CanvasToolLayout,
  shouldShowTransientCanvasToolHint,
} from "@/features/bead/lib/canvas-tool-hint";
import type { CanvasTool } from "@/features/bead/types";

const TRANSIENT_TOOL_TOOLTIP_DURATION_MS = 1500;

type EditorToolDockProps = {
  className?: string;
  layout: CanvasToolLayout;
  onSelectTool: (tool: CanvasTool) => void;
  tool: CanvasTool;
};

export function EditorToolDock({
  className,
  layout,
  onSelectTool,
  tool,
}: EditorToolDockProps) {
  const isDesktop = layout === "desktop";
  const pointerTypeRef = useRef<string | null>(null);
  const showTransientTooltipForClickRef = useRef(false);
  const [transientTooltip, setTransientTooltip] = useState<{
    tool: CanvasTool;
  } | null>(null);
  const usesTransientTooltips = !isDesktop || transientTooltip !== null;

  useEffect(() => {
    if (transientTooltip === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTransientTooltip(null);
    }, TRANSIENT_TOOL_TOOLTIP_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [transientTooltip]);

  const handleSelectTool = (nextTool: CanvasTool) => {
    onSelectTool(nextTool);

    const showTransientTooltip = showTransientTooltipForClickRef.current;
    showTransientTooltipForClickRef.current = false;

    if (showTransientTooltip) {
      setTransientTooltip({ tool: nextTool });
    } else {
      setTransientTooltip(null);
    }
  };

  const toolbar = (
    <div
      className={cn(
        "flex items-center gap-1.5",
        isDesktop
          ? cn(editorToolSurfaceClassName, "pointer-events-auto")
          : "shrink-0",
      )}
      onClickCapture={() => {
        showTransientTooltipForClickRef.current =
          shouldShowTransientCanvasToolHint({
            layout,
            pointerType: pointerTypeRef.current,
          });
        pointerTypeRef.current = null;
      }}
      onPointerCancelCapture={() => {
        pointerTypeRef.current = null;
      }}
      onPointerDownCapture={(event) => {
        pointerTypeRef.current = event.pointerType;
      }}
      onPointerMoveCapture={(event) => {
        if (
          isDesktop &&
          transientTooltip !== null &&
          event.pointerType === "mouse"
        ) {
          setTransientTooltip(null);
        }
      }}
      role="toolbar"
      aria-label="画布工具"
    >
      {canvasToolDefinitions.map((definition) => (
        <EditorToolButton
          icon={definition.icon}
          isActive={tool === definition.tool}
          key={definition.tool}
          label={definition.label}
          onClick={() => handleSelectTool(definition.tool)}
          tooltipOpen={
            usesTransientTooltips
              ? transientTooltip?.tool === definition.tool
              : undefined
          }
        />
      ))}
    </div>
  );

  if (!isDesktop) {
    return toolbar;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4",
        className,
      )}
    >
      {toolbar}
    </div>
  );
}
