import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { getMardColor, hexToRgb } from "@bead/core/colors";
import type { PublishDiscoverProject } from "@bead/core/discover";
import sharp from "sharp";

export const DISCOVER_THUMBNAIL_SCALE = 4;

export async function renderDiscoverThumbnailPng(
  project: Pick<PublishDiscoverProject, "sizeId" | "snapshot">,
) {
  const { cols, rows } = getCanvasSizeDefinition(project.sizeId);
  const pixels = renderDiscoverThumbnailPixels(project.snapshot, rows, cols);

  return sharp(pixels, {
    raw: {
      channels: 4,
      height: rows,
      width: cols,
    },
  })
    .resize(cols * DISCOVER_THUMBNAIL_SCALE, rows * DISCOVER_THUMBNAIL_SCALE, {
      kernel: "nearest",
    })
    .png()
    .toBuffer();
}

function renderDiscoverThumbnailPixels(
  snapshot: CanvasSnapshot,
  rows: number,
  cols: number,
) {
  const cellCount = rows * cols;
  const pixels = Buffer.alloc(cellCount * 4);

  for (const [index, code] of snapshot.cells) {
    if (!Number.isInteger(index) || index < 0 || index >= cellCount) {
      throw new Error(`Canvas snapshot index is out of range: ${index}`);
    }

    const color = getMardColor(code);
    if (!color) {
      throw new Error(`Canvas snapshot contains an unknown color: ${code}`);
    }

    const offset = index * 4;
    if (pixels[offset + 3] === 255) {
      throw new Error(`Canvas snapshot index is duplicated: ${index}`);
    }

    const { r, g, b } = hexToRgb(color.hex);
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = 255;
  }

  return pixels;
}
