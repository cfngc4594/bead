import { Button } from "@bead/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import {
  Blend,
  Eraser,
  Hand,
  type LucideIcon,
  MousePointer2,
  PenLine,
  Pipette,
} from "lucide-react";
import type { CanvasTool } from "@/features/bead/types";
import { cn } from "@/lib/utils";

type ModeToolButtonsProps = {
  tool: CanvasTool;
  className?: string;
  onSelectTool: (tool: CanvasTool) => void;
};

type ModeToolAction = {
  tool: CanvasTool;
  label: string;
  icon: LucideIcon;
};

const modeToolActions: ModeToolAction[] = [
  {
    icon: Hand,
    label: "移动画布",
    tool: "pan",
  },
  {
    icon: PenLine,
    label: "画笔",
    tool: "paint",
  },
  {
    icon: Blend,
    label: "混豆画笔",
    tool: "mix",
  },
  {
    icon: Eraser,
    label: "橡皮擦",
    tool: "erase",
  },
  {
    icon: Pipette,
    label: "吸管",
    tool: "picker",
  },
  {
    icon: MousePointer2,
    label: "选择移动",
    tool: "select",
  },
];

export function ModeToolButtons({
  tool,
  className,
  onSelectTool,
}: ModeToolButtonsProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      {modeToolActions.map((action) => (
        <ModeToolButton
          icon={action.icon}
          isActive={tool === action.tool}
          key={action.tool}
          label={action.label}
          onClick={() => onSelectTool(action.tool)}
        />
      ))}
    </div>
  );
}

function ModeToolButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={isActive || undefined}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block">{label}</TooltipContent>
    </Tooltip>
  );
}
