"use client";

import {
  Eraser,
  Hand,
  type LucideIcon,
  MousePointer2,
  PenLine,
  Pipette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CanvasTool } from "@/features/bead/types";
import { cn } from "@/lib/utils";

type BeadModeToolButtonsProps = {
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

export function BeadModeToolButtons({
  tool,
  className,
  onSelectTool,
}: BeadModeToolButtonsProps) {
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
