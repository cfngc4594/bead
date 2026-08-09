import { cn } from "@bead/ui/lib/utils";
import { useEffect, useState } from "react";
import {
  EditorToolButton,
  editorToolSurfaceClassName,
} from "@/features/bead/components/editor-tool-button";
import { canvasToolDefinitions } from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

const MOBILE_TOOL_TOOLTIP_DURATION_MS = 1500;

type EditorToolDockProps = {
  className?: string;
  layout: "desktop" | "mobile";
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
  const [mobileTooltip, setMobileTooltip] = useState<{
    tool: CanvasTool;
  } | null>(null);

  useEffect(() => {
    if (mobileTooltip === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMobileTooltip(null);
    }, MOBILE_TOOL_TOOLTIP_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mobileTooltip]);

  const handleSelectTool = (nextTool: CanvasTool) => {
    onSelectTool(nextTool);
    if (!isDesktop) {
      setMobileTooltip({ tool: nextTool });
    }
  };

  const toolbar = (
    <div
      data-onboarding={`editor-tools-${layout}`}
      className={cn(
        "flex items-center gap-1.5",
        isDesktop
          ? cn(editorToolSurfaceClassName, "pointer-events-auto")
          : "shrink-0",
      )}
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
            isDesktop ? undefined : mobileTooltip?.tool === definition.tool
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
