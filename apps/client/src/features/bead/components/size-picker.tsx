import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { colorSchemes, DEFAULT_COLOR_SCHEME_ID } from "@bead/core/colors";
import { Button } from "@bead/ui/components/button";
import { Card, CardContent } from "@bead/ui/components/card";
import { Label } from "@bead/ui/components/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@bead/ui/components/native-select";
import { cn } from "@bead/ui/lib/utils";
import { useState } from "react";
import { canvasSizes, getCanvasSize } from "@/config/canvas-sizes";
import {
  createProject as createStoredProject,
  type Project,
} from "@/features/bead/storage/projects";
import { trackEvent } from "@/lib/analytics";

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
  const [selectedColorSchemeId, setSelectedColorSchemeId] = useState(
    DEFAULT_COLOR_SCHEME_ID,
  );
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateProject() {
    if (isCreating) {
      return;
    }

    const size = getCanvasSize(selected);
    setIsCreating(true);

    try {
      const project = await createStoredProject(
        selected,
        selectedColorSchemeId,
      );

      trackEvent("project_created", {
        cols: size.cols,
        rows: size.rows,
        sizeId: size.id,
        colorSchemeId: selectedColorSchemeId,
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

      {colorSchemes.length > 1 ? (
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
          <Label htmlFor="color-scheme">色卡方案</Label>
          <NativeSelect
            id="color-scheme"
            onChange={(event) => setSelectedColorSchemeId(event.target.value)}
            value={selectedColorSchemeId}
          >
            {colorSchemes.map((scheme) => (
              <NativeSelectOption key={scheme.id} value={scheme.id}>
                {scheme.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      ) : null}

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
