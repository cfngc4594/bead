import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import {
  createPaletteEntries,
  findNearestPaletteColor,
  mardColors,
} from "@bead/core/colors";
import sharp from "sharp";

const BACKGROUND_CHANNEL_MIN = 245;
const MAX_PATTERN_COLORS = 16;
const mardPalette = createPaletteEntries(mardColors);

export async function imageToCanvasSnapshot(
  imageBytes: Uint8Array,
  rows: number,
  cols: number,
): Promise<CanvasSnapshot> {
  const quantizedImage = await sharp(imageBytes)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(cols, rows, { fit: "fill", kernel: sharp.kernel.nearest })
    .png({
      colors: MAX_PATTERN_COLORS,
      dither: 0,
      effort: 10,
      palette: true,
    })
    .toBuffer();
  const { data, info } = await sharp(quantizedImage)
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== cols || info.height !== rows || info.channels !== 3) {
    throw new Error("Unexpected raster dimensions");
  }

  const background = findConnectedBackground(data, rows, cols);
  const cells: CanvasSnapshot["cells"] = [];

  for (let index = 0; index < rows * cols; index += 1) {
    if (background[index] === 1) {
      continue;
    }

    const offset = index * 3;
    const color = findNearestPaletteColor(
      { r: data[offset], g: data[offset + 1], b: data[offset + 2] },
      mardPalette,
    );
    cells.push([index, color.code]);
  }

  return { cells };
}

function findConnectedBackground(
  pixels: Uint8Array,
  rows: number,
  cols: number,
) {
  const background = new Uint8Array(rows * cols);
  const queue = new Int32Array(rows * cols);
  let head = 0;
  let tail = 0;

  const enqueue = (index: number) => {
    if (background[index] === 1 || !isNearWhite(pixels, index)) {
      return;
    }
    background[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let col = 0; col < cols; col += 1) {
    enqueue(col);
    enqueue((rows - 1) * cols + col);
  }
  for (let row = 1; row < rows - 1; row += 1) {
    enqueue(row * cols);
    enqueue(row * cols + cols - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const row = Math.floor(index / cols);
    const col = index % cols;

    if (row > 0) enqueue(index - cols);
    if (row + 1 < rows) enqueue(index + cols);
    if (col > 0) enqueue(index - 1);
    if (col + 1 < cols) enqueue(index + 1);
  }

  return background;
}

function isNearWhite(pixels: Uint8Array, index: number) {
  const offset = index * 3;
  return (
    pixels[offset] >= BACKGROUND_CHANNEL_MIN &&
    pixels[offset + 1] >= BACKGROUND_CHANNEL_MIN &&
    pixels[offset + 2] >= BACKGROUND_CHANNEL_MIN
  );
}
