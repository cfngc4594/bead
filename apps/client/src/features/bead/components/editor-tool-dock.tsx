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
  const toolbar = (
    <div
      className={cn(
        layout === "desktop"
          ? cn(
              editorToolSurfaceClassName,
              "pointer-events-auto flex items-center gap-1.5",
            )
          : "flex max-w-[min(100%,17.5rem)] shrink-0 items-center gap-1.5 overflow-x-auto",
        layout === "mobile" && className,
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
        />
      ))}
    </div>
  );

  if (layout === "mobile") {
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
