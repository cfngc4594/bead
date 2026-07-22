import {
  type CanvasSizeId,
  canvasSizeDefinitions,
} from "@bead/core/canvas-sizes";

export const canvasSizes = [
  {
    ...canvasSizeDefinitions["16x16"],
    title: "16x16",
    desc: "手机挂件",
    emoji: "🐰",
  },
  {
    ...canvasSizeDefinitions["29x29"],
    title: "29x29",
    desc: "头像贴纸",
    emoji: "🐻",
  },
  {
    ...canvasSizeDefinitions["58x58"],
    title: "58x58",
    desc: "双板作品",
    emoji: "🌷",
  },
  {
    ...canvasSizeDefinitions["87x87"],
    title: "87x87",
    desc: "大型作品",
    emoji: "🖼️",
  },
] as const;
export type CanvasSize = Extract<
  (typeof canvasSizes)[number],
  { id: CanvasSizeId }
>;

const canvasSizesById = Object.fromEntries(
  canvasSizes.map((size) => [size.id, size]),
) as Record<CanvasSizeId, CanvasSize>;

export function getCanvasSize(id: CanvasSizeId): CanvasSize {
  return canvasSizesById[id];
}
