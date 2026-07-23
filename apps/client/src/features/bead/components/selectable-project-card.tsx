import { cn } from "@bead/ui/lib/utils";
import { Check } from "lucide-react";
import { getCanvasSize } from "@/config/canvas-sizes";
import { ProjectPreview } from "@/features/bead/components/project-preview";
import type { ProjectChoice } from "@/features/bead/hooks/use-project-choices";

export function SelectableProjectCard({
  isSelected,
  onToggle,
  project,
}: {
  isSelected: boolean;
  onToggle: () => void;
  project: ProjectChoice;
}) {
  const size = getCanvasSize(project.sizeId);

  return (
    <button
      aria-label={`${isSelected ? "取消选择" : "选择"}「${project.title}」`}
      aria-pressed={isSelected}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-left shadow-xs outline-none transition-colors hover:border-primary/50 hover:bg-muted/20 focus-visible:ring-3 focus-visible:ring-ring/50",
        isSelected && "border-primary ring-1 ring-primary",
      )}
      onClick={onToggle}
      type="button"
    >
      <div className="aspect-4/3 bg-muted/30">
        <ProjectPreview
          cols={size.cols}
          rows={size.rows}
          snapshot={project.snapshots[project.currentIndex]}
        />
      </div>
      <div className="flex items-center gap-3 border-t px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{project.title}</p>
          <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
            {size.title}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-lg border border-input",
            isSelected && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {isSelected ? <Check className="size-3.5" /> : null}
        </span>
      </div>
    </button>
  );
}
