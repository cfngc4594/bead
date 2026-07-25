import { Button } from "@bead/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import type { LucideIcon } from "lucide-react";

export const editorToolSurfaceClassName = "rounded-lg bg-card p-1.5 shadow-md";

type EditorToolButtonProps = {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  disabled?: boolean;
  ariaExpanded?: boolean;
  onClick: () => void;
};

export function EditorToolButton({
  label,
  icon: Icon,
  isActive,
  disabled = false,
  ariaExpanded,
  onClick,
}: EditorToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-expanded={ariaExpanded}
          aria-label={label}
          aria-pressed={isActive}
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block" side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
