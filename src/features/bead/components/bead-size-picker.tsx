"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type CanvasSizeId,
  canvasSizes,
  getCanvasSize,
} from "@/config/canvas-sizes";
import { createBeadDocument } from "@/features/bead/storage/bead-documents";
import { cn } from "@/lib/utils";

type BeadSizePickerProps = {
  initialSize: CanvasSizeId;
};

export function BeadSizePicker({ initialSize }: BeadSizePickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CanvasSizeId>(initialSize);
  const [isCreating, setIsCreating] = useState(false);

  async function createProject() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const document = await createBeadDocument(getCanvasSize(selected));

      router.push(`/projects?projectId=${document.id}`);
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
              onClick={() => setSelected(sizeItem.id)}
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
          onClick={createProject}
          size="lg"
          type="button"
        >
          {isCreating ? "正在创建" : "开始创作"}
        </Button>
        <Button asChild className="min-w-48 rounded-full" variant="outline">
          <Link href="/projects">返回作品</Link>
        </Button>
      </div>
    </>
  );
}
