import { Button } from "@bead/ui/components/button";
import { CheckSquare } from "lucide-react";

type ProjectsToolbarProps = {
  onSelectModeChange: (enabled: boolean) => void;
  selectMode: boolean;
};

export function ProjectsToolbar({
  onSelectModeChange,
  selectMode,
}: ProjectsToolbarProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <h1 className="font-semibold text-lg tracking-tight">作品</h1>
      <Button
        aria-pressed={selectMode}
        className="h-8"
        onClick={() => onSelectModeChange(!selectMode)}
        type="button"
        variant={selectMode ? "secondary" : "outline"}
      >
        <CheckSquare aria-hidden="true" />
        {selectMode ? "取消选择" : "选择"}
      </Button>
    </div>
  );
}
