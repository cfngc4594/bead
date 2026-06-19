"use client";

import { useSearchParams } from "next/navigation";
import {
  canvasSizes,
  getCanvasSize,
  isCanvasSizeId,
} from "@/config/canvas-sizes";
import { BeadEditor } from "@/features/bead/components/bead-editor";

export function BeadEditorFromUrl() {
  const searchParams = useSearchParams();
  const size = searchParams.get("size");
  const selected = isCanvasSizeId(size) ? size : canvasSizes[0].id;

  return <BeadEditor size={getCanvasSize(selected)} />;
}
