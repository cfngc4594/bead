"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type CanvasSizeId, canvasSizes } from "@/config/canvas-sizes";
import { cn } from "@/lib/utils";

type BeadSizePickerProps = {
  initialSize: CanvasSizeId;
};

export function BeadSizePicker({ initialSize }: BeadSizePickerProps) {
  const [selected, setSelected] = useState<CanvasSizeId>(initialSize);

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

      <div className="flex justify-center">
        <Button asChild className="min-w-48 rounded-full" size="lg">
          <Link href={`/editor?size=${selected}`}>开始创作</Link>
        </Button>
      </div>
    </>
  );
}
