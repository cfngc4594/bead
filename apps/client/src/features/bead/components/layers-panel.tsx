import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Lock,
  type LucideIcon,
  Pencil,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import type { MouseEventHandler } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BeadLayer } from "@/features/bead/lib/canvas-document";
import { cn } from "@/lib/utils";

type LayersPanelProps = {
  activeLayerId: string;
  layers: BeadLayer[];
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onRenameLayer: (layerId: string, name: string) => void;
  onReorderLayer: (fromIndex: number, toIndex: number) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerHidden: (layerId: string) => void;
  onToggleLayerLocked: (layerId: string) => void;
};

export function LayersPanel({
  activeLayerId,
  layers,
  onAddLayer,
  onDeleteLayer,
  onRenameLayer,
  onReorderLayer,
  onSelectLayer,
  onToggleLayerHidden,
  onToggleLayerLocked,
}: LayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const activeLayer =
    layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

  function beginRename(layer: BeadLayer) {
    setEditingLayerId(layer.id);
    setDraftName(layer.name);
  }

  function commitRename() {
    if (!editingLayerId) {
      return;
    }

    onRenameLayer(editingLayerId, draftName);
    setEditingLayerId(null);
    setDraftName("");
  }

  function cancelRename() {
    setEditingLayerId(null);
    setDraftName("");
  }

  function moveDraggedLayer(targetLayerId: string) {
    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      return;
    }

    const fromIndex = layers.findIndex((layer) => layer.id === draggedLayerId);
    const toIndex = layers.findIndex((layer) => layer.id === targetLayerId);

    if (fromIndex >= 0 && toIndex >= 0) {
      onReorderLayer(fromIndex, toIndex);
    }
  }

  return (
    <div className="absolute right-3 top-3 z-10 w-[min(18rem,calc(100vw-1.5rem))] text-sm md:right-4 md:top-4">
      <Button
        aria-expanded={isOpen}
        className="ml-auto flex max-w-full justify-between gap-2 border bg-background/95 shadow-sm backdrop-blur"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
        variant="outline"
      >
        <Layers />
        <span className="min-w-0 flex-1 truncate text-left">
          {activeLayer?.name ?? "图层"}
        </span>
        <ChevronDown
          className={cn(
            "transition-transform",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </Button>

      {isOpen ? (
        <div className="mt-2 overflow-hidden rounded-lg border bg-background/95 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-2 border-b p-2">
            <div className="flex min-w-0 items-center gap-2 px-1 font-medium">
              <Layers className="size-4 shrink-0" />
              <span className="truncate">图层</span>
            </div>
            <IconButton icon={Plus} label="新增图层" onClick={onAddLayer} />
          </div>

          <div className="max-h-[min(42vh,22rem)] overflow-y-auto p-1.5">
            {layers.map((layer, index) => (
              <div
                aria-current={layer.id === activeLayerId}
                className={cn(
                  "group flex h-10 w-full min-w-0 items-center gap-1 rounded-md border border-transparent px-1.5 text-left transition-colors",
                  layer.id === activeLayerId
                    ? "border-primary/30 bg-primary/10"
                    : "hover:bg-muted",
                  layer.isHidden ? "opacity-60" : null,
                  draggedLayerId === layer.id ? "opacity-50" : null,
                )}
                key={layer.id}
              >
                <button
                  className="flex h-full min-w-0 flex-1 items-center gap-1 text-left"
                  draggable={editingLayerId !== layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  onDragEnd={() => setDraggedLayerId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedLayerId(layer.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveDraggedLayer(layer.id);
                    setDraggedLayerId(null);
                  }}
                  type="button"
                >
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                  <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>

                  {editingLayerId === layer.id ? (
                    <Input
                      autoFocus
                      className="h-7 min-w-0 flex-1"
                      onBlur={commitRename}
                      onChange={(event) => setDraftName(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitRename();
                        }

                        if (event.key === "Escape") {
                          cancelRename();
                        }
                      }}
                      value={draftName}
                    />
                  ) : (
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        layer.isLocked ? "text-muted-foreground" : null,
                      )}
                    >
                      {layer.name}
                    </span>
                  )}
                </button>
                <IconButton
                  icon={layer.isHidden ? EyeOff : Eye}
                  isActive={layer.isHidden}
                  label={layer.isHidden ? "显示图层" : "隐藏图层"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLayerHidden(layer.id);
                  }}
                />
                <IconButton
                  icon={layer.isLocked ? Lock : Unlock}
                  isActive={layer.isLocked}
                  label={layer.isLocked ? "解锁图层" : "锁定图层"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLayerLocked(layer.id);
                  }}
                />
                <IconButton
                  icon={Pencil}
                  label="重命名图层"
                  onClick={(event) => {
                    event.stopPropagation();
                    beginRename(layer);
                  }}
                />
                <IconButton
                  disabled={layers.length <= 1}
                  icon={Trash2}
                  label="删除图层和豆子"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  disabled = false,
  icon: Icon,
  isActive = false,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="size-7"
          disabled={disabled}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant={isActive ? "secondary" : "ghost"}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="hidden md:block">{label}</TooltipContent>
    </Tooltip>
  );
}
