import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";

/** Small grids: structured bead codes. Large grids: stylize + sample. */
export function shouldUseStructuredBeadPattern(sizeId: CanvasSizeId) {
  return getCanvasSizeDefinition(sizeId).rows <= 29;
}
