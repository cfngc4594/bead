import { cn } from "@bead/ui/lib/utils";
import { EditorMainTools } from "@/features/bead/components/editor-main-tools";
import type { DrawToolController } from "@/features/bead/hooks/use-draw-tool-controller";
import type { CanvasTool } from "@/features/bead/types";

type MobileEditorToolDockProps = {
  className?: string;
  controller: DrawToolController;
  tool: CanvasTool;
};

export function MobileEditorToolDock({
  className,
  controller,
  tool,
}: MobileEditorToolDockProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-1.5", className)}
      role="toolbar"
      aria-label="画布工具"
    >
      <EditorMainTools controller={controller} tool={tool} />
    </div>
  );
}
