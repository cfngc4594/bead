import { cn } from "@bead/ui/lib/utils";
import {
  EditorToolButton,
  editorToolSurfaceClassName,
} from "@/features/bead/components/editor-tool-button";
import { canvasToolDefinitions } from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

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
  const toolbar = (
    <div
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
          onClick={() => onSelectTool(definition.tool)}
          withTooltip={isDesktop}
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
