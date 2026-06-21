import {
  ArrowLeft,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  Focus,
  Grid3x3,
  Hand,
  type LucideIcon,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Pipette,
  Redo2,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BeadProjectTitleEditor } from "@/features/bead/components/bead-project-title-editor";
import type { CanvasTool } from "@/features/bead/types";

type BeadToolbarProps = {
  tool: CanvasTool;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  projectTitle: string;
  showBeadCodes: boolean;
  showGuideLines: boolean;
  onToggleBeadCodes: () => void;
  onToggleGuideLines: () => void;
  onBack: () => void;
  onRenameProject: (title: string) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onResetView: () => void;
  onClearDraft: () => void;
  onExportImage: () => void;
  onExportTemplate: () => void;
  onImportTemplate: () => void;
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

type ToolbarAction = {
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
  canClear,
  projectTitle,
  showBeadCodes,
  showGuideLines,
  onToggleBeadCodes,
  onToggleGuideLines,
  onBack,
  onRenameProject,
  onSelectTool,
  onResetView,
  onClearDraft,
  onExportImage,
  onExportTemplate,
  onImportTemplate,
  onUndo,
  onRedo,
}: BeadToolbarProps) {
  const modeActions: ToolbarAction[] = [
    {
      icon: Hand,
      isActive: tool === "pan",
      label: "移动画布",
      onClick: () => onSelectTool("pan"),
    },
    {
      icon: PenLine,
      isActive: tool === "paint",
      label: "画笔",
      onClick: () => onSelectTool("paint"),
    },
    {
      icon: Eraser,
      isActive: tool === "erase",
      label: "橡皮擦",
      onClick: () => onSelectTool("erase"),
    },
    {
      icon: Pipette,
      isActive: tool === "picker",
      label: "吸管",
      onClick: () => onSelectTool("picker"),
    },
    {
      icon: MousePointer2,
      isActive: tool === "select",
      label: "选择移动",
      onClick: () => onSelectTool("select"),
    },
  ];
  const viewActions: ToolbarAction[] = [
    {
      icon: Focus,
      label: "居中显示",
      onClick: onResetView,
    },
    {
      icon: showBeadCodes ? Eye : EyeOff,
      isActive: !showBeadCodes,
      label: showBeadCodes ? "隐藏豆色序号" : "显示豆色序号",
      onClick: onToggleBeadCodes,
    },
    {
      icon: Grid3x3,
      isActive: showGuideLines,
      label: showGuideLines ? "隐藏辅助线" : "显示辅助线",
      onClick: onToggleGuideLines,
    },
  ];
  const historyActions: ToolbarAction[] = [
    {
      disabled: !canUndo,
      icon: Undo2,
      label: "撤销",
      onClick: onUndo,
    },
    {
      disabled: !canRedo,
      icon: Redo2,
      label: "重做",
      onClick: onRedo,
    },
    {
      disabled: !canClear,
      icon: RotateCcw,
      label: "清空草稿",
      onClick: onClearDraft,
    },
  ];
  const fileActions: ToolbarAction[] = [
    {
      icon: FileUp,
      label: "导入模板",
      onClick: onImportTemplate,
    },
    {
      icon: FileDown,
      label: "导出模板",
      onClick: onExportTemplate,
    },
    {
      icon: Download,
      label: "导出图片",
      onClick: onExportImage,
    },
  ];
  const desktopGroups = [modeActions, viewActions, historyActions, fileActions];
  const mobileMoreActions = [...viewActions, ...historyActions, ...fileActions];

  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b px-3 md:gap-3 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
        <ToolbarIconButton icon={ArrowLeft} label="返回作品" onClick={onBack} />
        <BeadProjectTitleEditor
          className="min-w-0 flex-1 md:w-56 md:flex-none"
          title={projectTitle}
          onRename={onRenameProject}
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 md:flex">
        {desktopGroups.map((actions, index) => (
          <ToolbarActionGroup
            actions={actions}
            key={actions.map((action) => action.label).join("-")}
            withSeparator={index > 0}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:hidden">
        {modeActions.map((action) => (
          <ToolbarIconButton key={action.label} {...action} />
        ))}
        <MobileMoreTools actions={mobileMoreActions} />
      </div>
    </header>
  );
}

function ToolbarActionGroup({
  actions,
  withSeparator = false,
}: {
  actions: ToolbarAction[];
  withSeparator?: boolean;
}) {
  return (
    <>
      {withSeparator ? <ToolbarSeparator /> : null}
      {actions.map((action) => (
        <ToolbarIconButton key={action.label} {...action} />
      ))}
    </>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-border" />;
}

function MobileMoreTools({ actions }: { actions: ToolbarAction[] }) {
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button aria-label="更多工具" size="icon-sm" variant="outline">
              <MoreHorizontal />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>更多工具</TooltipContent>
      </Tooltip>
      <SheetContent
        className="max-h-[80vh] rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        side="bottom"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>更多工具</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {actions.map((action) => (
            <SheetActionButton key={action.label} {...action} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetActionButton({
  label,
  icon: Icon,
  disabled = false,
  isActive = false,
  onClick,
}: ToolbarAction) {
  return (
    <Button
      aria-pressed={isActive || undefined}
      className="h-11 justify-start gap-2"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={isActive ? "default" : "outline"}
    >
      <Icon />
      <span className="truncate">{label}</span>
    </Button>
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
