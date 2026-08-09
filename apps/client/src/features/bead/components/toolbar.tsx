import { Button } from "@bead/ui/components/button";
import {
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@bead/ui/components/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bead/ui/components/tooltip";
import {
  ArrowLeft,
  CircleHelp,
  Download,
  FileDown,
  FileUp,
  Focus,
  ImageUp,
  LoaderCircle,
  type LucideIcon,
  MoreHorizontal,
  PanelTop,
  Redo2,
  Rotate3D,
  RotateCcw,
  Sparkles,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { ProjectTitleEditor } from "@/features/bead/components/project-title-editor";
import { NativeBackSheet } from "@/features/native/native-back-overlays";
import { NativeBottomSheetContent } from "@/features/native/native-safe-area";

type EditorToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  projectTitle: string;
  isModelPreviewOpen: boolean;
  isExportImageSheetEnabled: boolean;
  onBack: () => void;
  onRenameProject: (title: string) => void;
  onResetView: () => void;
  onPreviewModel: () => void;
  onClearDraft: () => void;
  onExportImage: () => void;
  onExportTemplate: () => void;
  onImportAiImage: () => void;
  onImportAlgorithmImage: () => void;
  onImportTemplate: () => void;
  onStartOnboarding: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isExportingImage?: boolean;
  isGeneratingAiImage?: boolean;
  isGeneratingAlgorithmImage?: boolean;
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
  closeSheetOnClick?: boolean;
  disabled?: boolean;
  loading?: boolean;
  isActive?: boolean;
  onClick: () => void;
};

export function EditorToolbar({
  canUndo,
  canRedo,
  canClear,
  projectTitle,
  isModelPreviewOpen,
  isExportImageSheetEnabled,
  onBack,
  onRenameProject,
  onResetView,
  onPreviewModel,
  onClearDraft,
  onExportImage,
  onExportTemplate,
  onImportAiImage,
  onImportAlgorithmImage,
  onImportTemplate,
  onStartOnboarding,
  onUndo,
  onRedo,
  isExportingImage = false,
  isGeneratingAiImage = false,
  isGeneratingAlgorithmImage = false,
  isPreparingModelPreview = false,
}: EditorToolbarProps) {
  const disableCanvasEditActions = isModelPreviewOpen;
  const isGeneratingFromImage =
    isGeneratingAiImage || isGeneratingAlgorithmImage;
  const resetViewAction: ToolbarAction = {
    icon: Focus,
    label: "居中显示",
    onClick: onResetView,
  };
  const previewModelAction: ToolbarAction = {
    closeSheetOnClick: true,
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
  const viewActions = [resetViewAction, previewModelAction];
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
      closeSheetOnClick: true,
      disabled: isGeneratingFromImage,
      icon: Sparkles,
      label: isGeneratingAiImage ? "AI 生成中" : "AI 生成豆图",
      loading: isGeneratingAiImage,
      onClick: onImportAiImage,
    },
    {
      closeSheetOnClick: true,
      disabled: isGeneratingFromImage,
      icon: ImageUp,
      label: isGeneratingAlgorithmImage ? "算法生成中" : "算法生成豆图",
      loading: isGeneratingAlgorithmImage,
      onClick: onImportAlgorithmImage,
    },
    {
      closeSheetOnClick: !isExportImageSheetEnabled,
      disabled: isExportingImage,
      icon: Download,
      label: isExportingImage ? "导出中" : "导出图片",
      loading: isExportingImage,
      onClick: onExportImage,
    },
    {
      closeSheetOnClick: true,
      icon: FileUp,
      label: "导入模板",
      onClick: onImportTemplate,
    },
    {
      closeSheetOnClick: true,
      icon: FileDown,
      label: "导出模板",
      onClick: onExportTemplate,
    },
  ];
  const onboardingAction: ToolbarAction = {
    closeSheetOnClick: true,
    icon: CircleHelp,
    label: "新手引导",
    onClick: onStartOnboarding,
  };
  const mobilePrimaryActions = [...viewActions, ...historyActions];

  return (
    <header
      className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b px-3 md:gap-3 md:px-5"
      data-onboarding="editor-toolbar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
        <ToolbarIconButton icon={ArrowLeft} label="返回作品" onClick={onBack} />
        <ProjectTitleEditor
          className="min-w-0 flex-1 md:w-56 md:flex-none"
          title={projectTitle}
          onRename={onRenameProject}
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 md:flex">
        {[viewActions, historyActions, fileActions, [onboardingAction]].map(
          (actions, index) => (
            <ToolbarActionGroup
              actions={actions}
              key={actions.map((action) => action.label).join("-")}
              withSeparator={index > 0}
            />
          ),
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:hidden">
        {mobilePrimaryActions.map((action) => (
          <ToolbarIconButton key={action.label} {...action} />
        ))}
        <MobileMoreTools actions={[...fileActions, onboardingAction]} />
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
    <NativeBackSheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button aria-label="更多工具" size="icon-sm" variant="outline">
              <MoreHorizontal />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent className="hidden md:block">更多工具</TooltipContent>
      </Tooltip>
      <NativeBottomSheetContent className="max-h-[80vh] rounded-t-xl">
        <SheetHeader className="pb-0">
          <SheetTitle>更多工具</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {actions.map((action) => (
            <SheetActionButton
              key={action.label}
              {...action}
              onClick={() => {
                if (action.closeSheetOnClick) {
                  setOpen(false);
                }
                action.onClick();
              }}
            />
          ))}
        </div>
      </NativeBottomSheetContent>
    </NativeBackSheet>
  );
}

function SheetActionButton({
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
      title={label}
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
