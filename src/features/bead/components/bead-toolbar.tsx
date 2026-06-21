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
  MousePointer2,
  PenLine,
  Pipette,
  Redo2,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center gap-3 overflow-hidden border-b px-4 md:px-5">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <ToolbarIconButton icon={ArrowLeft} label="返回作品" onClick={onBack} />
        <ProjectTitleEditor title={projectTitle} onRename={onRenameProject} />
      </div>

      <div className="scrollbar-none flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto md:justify-center [&::-webkit-scrollbar]:hidden">
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
        <ToolbarIconButton
          icon={MousePointer2}
          isActive={tool === "select"}
          label="选择移动"
          onClick={() => onSelectTool("select")}
        />
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ToolbarIconButton
          icon={Hand}
          isActive={tool === "pan"}
          label="移动画布"
          onClick={() => onSelectTool("pan")}
        />
        <ToolbarIconButton
          icon={Focus}
          label="居中显示"
          onClick={onResetView}
        />
        <ToolbarIconButton
          icon={showBeadCodes ? Eye : EyeOff}
          isActive={!showBeadCodes}
          label={showBeadCodes ? "隐藏豆色序号" : "显示豆色序号"}
          onClick={onToggleBeadCodes}
        />
        <ToolbarIconButton
          icon={Grid3x3}
          isActive={showGuideLines}
          label={showGuideLines ? "隐藏辅助线" : "显示辅助线"}
          onClick={onToggleGuideLines}
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
        <ToolbarIconButton
          disabled={!canClear}
          icon={RotateCcw}
          label="清空草稿"
          onClick={onClearDraft}
        />
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ToolbarIconButton
          icon={FileUp}
          label="导入模板"
          onClick={onImportTemplate}
        />
        <ToolbarIconButton
          icon={FileDown}
          label="导出模板"
          onClick={onExportTemplate}
        />
        <ToolbarIconButton
          icon={Download}
          label="导出图片"
          onClick={onExportImage}
        />
      </div>
    </header>
  );
}

function ProjectTitleEditor({
  title,
  onRename,
}: {
  title: string;
  onRename: (title: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldSkipCommitRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const displayTitle = title.trim() || "未命名作品";
  const [draftTitle, setDraftTitle] = useState(displayTitle);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(displayTitle);
    }
  }, [displayTitle, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function commitTitle() {
    if (shouldSkipCommitRef.current) {
      shouldSkipCommitRef.current = false;
      return;
    }

    const nextTitle = draftTitle.trim();

    setIsEditing(false);

    if (!title.trim() && nextTitle === displayTitle) {
      return;
    }

    if (nextTitle !== title.trim()) {
      onRename(nextTitle);
    }
  }

  function cancelEdit() {
    shouldSkipCommitRef.current = true;
    setDraftTitle(displayTitle);
    setIsEditing(false);
  }

  return (
    <div className="w-[42vw] max-w-56 min-w-28 shrink-0 md:w-56">
      {isEditing ? (
        <input
          aria-label="作品名"
          className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-medium text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          maxLength={80}
          onBlur={commitTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            }
          }}
          ref={inputRef}
          type="text"
          value={draftTitle}
        />
      ) : (
        <button
          aria-label="重命名作品"
          className="w-full truncate rounded-md px-2 py-1 text-left font-medium text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            setDraftTitle(displayTitle);
            setIsEditing(true);
          }}
          title={displayTitle}
          type="button"
        >
          {displayTitle}
        </button>
      )}
    </div>
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
