import { z } from "zod";

export const canvasSizes = [
  {
    id: "16x16",
    title: "16x16",
    desc: "手机挂件",
    emoji: "🐰",
    rows: 16,
    cols: 16,
  },
  {
    id: "29x29",
    title: "29x29",
    desc: "头像贴纸",
    emoji: "🐻",
    rows: 29,
    cols: 29,
  },
  {
    id: "58x58",
    title: "58x58",
    desc: "双板作品",
    emoji: "🌷",
    rows: 58,
    cols: 58,
  },
  {
    id: "87x87",
    title: "87x87",
    desc: "大型作品",
    emoji: "🖼️",
    rows: 87,
    cols: 87,
  },
] as const;

export const canvasSizeIdSchema = z.enum(["16x16", "29x29", "58x58", "87x87"]);

export type CanvasSizeId = z.infer<typeof canvasSizeIdSchema>;
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
