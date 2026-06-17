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
    id: "32x32",
    title: "32x32",
    desc: "桌面摆件",
    emoji: "🌷",
    rows: 32,
    cols: 32,
  },
  {
    id: "64x64",
    title: "64x64",
    desc: "大型作品",
    emoji: "🖼️",
    rows: 64,
    cols: 64,
  },
] as const;

export type CanvasSize = (typeof canvasSizes)[number];
export type CanvasSizeId = CanvasSize["id"];

export function isCanvasSizeId(value: unknown): value is CanvasSizeId {
  return (
    typeof value === "string" && canvasSizes.some((size) => size.id === value)
  );
}

export function getCanvasSize(id: CanvasSizeId): CanvasSize {
  return canvasSizes.find((size) => size.id === id) ?? canvasSizes[0];
}
