"use client";

import { useSearchParams } from "next/navigation";
import { canvasSizes, isCanvasSizeId } from "@/config/canvas-sizes";
import { BeadSizePicker } from "@/features/bead/components/bead-size-picker";

export function BeadSizePickerFromUrl() {
  const searchParams = useSearchParams();
  const size = searchParams.get("size");
  const selected = isCanvasSizeId(size) ? size : canvasSizes[0].id;

  return <BeadSizePicker initialSize={selected} />;
}
