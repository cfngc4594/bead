import {
  Download,
  Eraser,
  FileDown,
  Focus,
  Hand,
  type LucideIcon,
  PenLine,
  Pipette,
  Redo2,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CanvasTool } from "@/features/bead/types";

type BeadToolbarProps = {
  tool: CanvasTool;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: CanvasTool) => void;
  onResetView: () => void;
  onClearDraft: () => void;
  onExportImage: () => void;
  onExportTemplate: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

type ToolbarIconButtonProps = {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  isActive?: boolean;
  onClick: () => void;
};

export function BeadToolbar({
  tool,
  canUndo,
  canRedo,
  onSelectTool,
  onResetView,
  onClearDraft,
  onExportImage,
  onExportTemplate,
  onUndo,
  onRedo,
}: BeadToolbarProps) {
  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center justify-center overflow-hidden border-b px-4 md:px-5">
      <div className="scrollbar-none flex w-full min-w-0 items-center justify-center gap-1.5 overflow-x-auto md:w-auto [&::-webkit-scrollbar]:hidden">
        <ToolbarIconButton
          icon={Hand}
          isActive={tool === "pan"}
          label="移动"
          onClick={() => onSelectTool("pan")}
        />
        <ToolbarIconButton
          icon={PenLine}
          isActive={tool === "paint"}
          label="画笔"
          onClick={() => onSelectTool("paint")}
        />
        <ToolbarIconButton
          icon={Eraser}
          isActive={tool === "erase"}
          label="橡皮擦"
          onClick={() => onSelectTool("erase")}
        />
        <ToolbarIconButton
          icon={Pipette}
          isActive={tool === "picker"}
          label="吸管"
          onClick={() => onSelectTool("picker")}
        />
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ToolbarIconButton
          icon={Focus}
          label="居中显示"
          onClick={onResetView}
        />
        <ToolbarIconButton
          icon={Download}
          label="导出图片"
          onClick={onExportImage}
        />
        <ToolbarIconButton
          icon={FileDown}
          label="导出模板"
          onClick={onExportTemplate}
        />
        <ToolbarIconButton
          icon={RotateCcw}
          label="清空草稿"
          onClick={onClearDraft}
        />
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ToolbarIconButton
          disabled={!canUndo}
          icon={Undo2}
          label="撤销"
          onClick={onUndo}
        />
        <ToolbarIconButton
          disabled={!canRedo}
          icon={Redo2}
          label="重做"
          onClick={onRedo}
        />
      </div>
    </header>
  );
}

function ToolbarIconButton({
  label,
  icon: Icon,
  disabled = false,
  isActive = false,
  onClick,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={isActive || undefined}
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          variant={isActive ? "default" : "outline"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
