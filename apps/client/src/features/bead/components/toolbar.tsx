import { Button } from "@bead/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@bead/ui/components/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  Focus,
  Grid3x3,
  ImageUp,
  LoaderCircle,
  type LucideIcon,
  MoreHorizontal,
  PanelTop,
  Redo2,
  Rotate3D,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { ModeToolButtons } from "@/features/bead/components/mode-tool-buttons";
import { ProjectTitleEditor } from "@/features/bead/components/project-title-editor";
import type { CanvasTool } from "@/features/bead/types";

type EditorToolbarProps = {
  tool: CanvasTool;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  projectTitle: string;
  showBeadCodes: boolean;
  showGuideLines: boolean;
  isModelPreviewOpen: boolean;
  onToggleBeadCodes: () => void;
  onToggleGuideLines: () => void;
  onBack: () => void;
  onRenameProject: (title: string) => void;
  onSelectTool: (tool: CanvasTool) => void;
  onResetView: () => void;
  onPreviewModel: () => void;
  onClearDraft: () => void;
  onExportImage: () => void;
  onExportTemplate: () => void;
  onImportImage: () => void;
  onImportTemplate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isExportingImage?: boolean;
  isImportingImage?: boolean;
  isPreparingModelPreview?: boolean;
};

type ToolbarIconButtonProps = {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  isActive?: boolean;
  onClick: () => void;
};

type ToolbarAction = {
  label: string;
  icon: LucideIcon;
  closeDrawerOnClick?: boolean;
  disabled?: boolean;
  loading?: boolean;
  isActive?: boolean;
  onClick: () => void;
};

export function EditorToolbar({
  tool,
  canUndo,
  canRedo,
  canClear,
  projectTitle,
  showBeadCodes,
  showGuideLines,
  isModelPreviewOpen,
  onToggleBeadCodes,
  onToggleGuideLines,
  onBack,
  onRenameProject,
  onSelectTool,
  onResetView,
  onPreviewModel,
  onClearDraft,
  onExportImage,
  onExportTemplate,
  onImportImage,
  onImportTemplate,
  onUndo,
  onRedo,
  isExportingImage = false,
  isImportingImage = false,
  isPreparingModelPreview = false,
}: EditorToolbarProps) {
  const disableCanvasEditActions = isModelPreviewOpen;
  const resetViewAction: ToolbarAction = {
    icon: Focus,
    label: "居中显示",
    onClick: onResetView,
  };
  const previewModelAction: ToolbarAction = {
    closeDrawerOnClick: true,
    disabled: isPreparingModelPreview,
    icon: isModelPreviewOpen ? PanelTop : Rotate3D,
    isActive: isModelPreviewOpen,
    label: isPreparingModelPreview
      ? "准备 3D"
      : isModelPreviewOpen
        ? "返回画布"
        : "3D 预览",
    loading: isPreparingModelPreview,
    onClick: onPreviewModel,
  };
  const displayActions: ToolbarAction[] = [
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
  const viewActions = [resetViewAction, previewModelAction, ...displayActions];
  const historyActions: ToolbarAction[] = [
    {
      disabled: disableCanvasEditActions || !canUndo,
      icon: Undo2,
      label: "撤销",
      onClick: onUndo,
    },
    {
      disabled: disableCanvasEditActions || !canRedo,
      icon: Redo2,
      label: "重做",
      onClick: onRedo,
    },
    {
      disabled: disableCanvasEditActions || !canClear,
      icon: RotateCcw,
      label: "清空草稿",
      onClick: onClearDraft,
    },
  ];
  const fileActions: ToolbarAction[] = [
    {
      closeDrawerOnClick: true,
      disabled: isImportingImage,
      icon: ImageUp,
      label: isImportingImage ? "导入中" : "导入图片",
      onClick: onImportImage,
    },
    {
      closeDrawerOnClick: true,
      disabled: isExportingImage,
      icon: Download,
      label: isExportingImage ? "导出中" : "导出图片",
      loading: isExportingImage,
      onClick: onExportImage,
    },
    {
      closeDrawerOnClick: true,
      icon: FileUp,
      label: "导入模板",
      onClick: onImportTemplate,
    },
    {
      closeDrawerOnClick: true,
      icon: FileDown,
      label: "导出模板",
      onClick: onExportTemplate,
    },
  ];
  const mobileTopViewActions = [resetViewAction, previewModelAction];
  const mobileDrawerActions = [...displayActions, ...fileActions];

  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b px-3 md:gap-3 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
        <ToolbarIconButton icon={ArrowLeft} label="返回作品" onClick={onBack} />
        <ProjectTitleEditor
          className="min-w-0 flex-1 lg:w-56 lg:flex-none"
          title={projectTitle}
          onRename={onRenameProject}
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex">
        <ModeToolButtons tool={tool} onSelectTool={onSelectTool} />
        {[viewActions, historyActions, fileActions].map((actions) => (
          <ToolbarActionGroup
            actions={actions}
            key={actions.map((action) => action.label).join("-")}
            withSeparator
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
        {mobileTopViewActions.map((action) => (
          <ToolbarIconButton key={action.label} {...action} />
        ))}
        {historyActions.map((action) => (
          <ToolbarIconButton key={action.label} {...action} />
        ))}
        <MobileMoreTools actions={mobileDrawerActions} />
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
  const [open, setOpen] = useState(false);

  return (
    <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button aria-label="更多工具" size="icon-sm" variant="outline">
              <MoreHorizontal />
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent className="hidden md:block">更多工具</TooltipContent>
      </Tooltip>
      <DrawerContent className="overflow-hidden">
        <DrawerHeader className="shrink-0 pb-0">
          <DrawerTitle>更多工具</DrawerTitle>
          <DrawerDescription className="sr-only">
            编辑画布的显示和文件工具
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {actions.map((action) => (
            <DrawerActionButton
              key={action.label}
              {...action}
              onClick={() => {
                if (action.closeDrawerOnClick) {
                  setOpen(false);
                }
                action.onClick();
              }}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerActionButton({
  label,
  icon: Icon,
  disabled = false,
  loading = false,
  isActive = false,
  onClick,
}: ToolbarAction) {
  const IconToRender = loading ? LoaderCircle : Icon;

  return (
    <Button
      aria-pressed={isActive || undefined}
      className="h-11 justify-start gap-2"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={isActive ? "default" : "outline"}
    >
      <IconToRender className={loading ? "animate-spin" : undefined} />
      <span className="truncate">{label}</span>
    </Button>
  );
}

function ToolbarIconButton({
  label,
  icon: Icon,
  disabled = false,
  loading = false,
  isActive = false,
  onClick,
}: ToolbarIconButtonProps) {
  const IconToRender = loading ? LoaderCircle : Icon;

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
          <IconToRender className={loading ? "animate-spin" : undefined} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block">{label}</TooltipContent>
    </Tooltip>
  );
}
