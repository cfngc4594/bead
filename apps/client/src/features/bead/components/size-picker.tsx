import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type CanvasSizeId,
  canvasSizes,
  getCanvasSize,
} from "@/config/canvas-sizes";
import {
  createProject as createStoredProject,
  type Project,
} from "@/features/bead/storage/projects";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type SizePickerProps = {
  initialSize: CanvasSizeId;
  onCancel: () => void;
  onProjectCreated: (project: Project) => void;
};

export function SizePicker({
  initialSize,
  onCancel,
  onProjectCreated,
}: SizePickerProps) {
  const [selected, setSelected] = useState<CanvasSizeId>(initialSize);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateProject() {
    if (isCreating) {
      return;
    }

    const size = getCanvasSize(selected);
    setIsCreating(true);

    try {
      const project = await createStoredProject(size);

      trackEvent("project_created", {
        cols: size.cols,
        rows: size.rows,
        sizeId: size.id,
      });
      onProjectCreated(project);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {canvasSizes.map((sizeItem) => {
          const isSelected = selected === sizeItem.id;

          return (
            <button
              aria-pressed={isSelected}
              className="min-w-0 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              key={sizeItem.id}
              onClick={() => {
                if (selected !== sizeItem.id) {
                  trackEvent("project_size_selected", {
                    cols: sizeItem.cols,
                    rows: sizeItem.rows,
                    sizeId: sizeItem.id,
                  });
                }
                setSelected(sizeItem.id);
              }}
              type="button"
            >
              <Card
                className={cn(
                  "h-full cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-lg active:translate-y-0",
                  isSelected && "ring-2 ring-primary shadow-lg",
                )}
              >
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <span className="text-4xl">{sizeItem.emoji}</span>

                  <div className="text-center">
                    <p className="font-semibold">{sizeItem.title}</p>

                    <p className="text-muted-foreground text-sm">
                      {sizeItem.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          className="min-w-48 rounded-full"
          disabled={isCreating}
          onClick={handleCreateProject}
          size="lg"
          type="button"
        >
          {isCreating ? "正在创建" : "开始创作"}
        </Button>
        <Button
          className="min-w-48 rounded-full"
          onClick={() => {
            trackEvent("project_create_cancelled", { sizeId: selected });
            onCancel();
          }}
          type="button"
          variant="outline"
        >
          返回作品
        </Button>
      </div>
    </>
  );
}
