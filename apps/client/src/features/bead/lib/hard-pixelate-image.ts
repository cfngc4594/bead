import { loadImageFile } from "@/features/bead/lib/image-raster";

/**
 * Force an image onto an exact rows×cols mosaic of solid squares so later
 * bead sampling aligns 1:1 with the canvas grid (no soft downscale blur).
 */
export async function hardPixelateImageFile(
  file: File,
  rows: number,
  cols: number,
  pixelsPerBead = 16,
): Promise<File> {
  const image = await loadImageFile(file);
  const source = document.createElement("canvas");
  source.width = Math.max(1, image.naturalWidth);
  source.height = Math.max(1, image.naturalHeight);

  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) {
    throw new Error("Unable to create canvas.");
  }

  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);
  const { data, width, height } = sourceContext.getImageData(
    0,
    0,
    source.width,
    source.height,
  );

  const out = document.createElement("canvas");
  out.width = cols * pixelsPerBead;
  out.height = rows * pixelsPerBead;
  const outContext = out.getContext("2d");
  if (!outContext) {
    throw new Error("Unable to create canvas.");
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x0 = Math.floor((col * width) / cols);
      const y0 = Math.floor((row * height) / rows);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * width) / cols));
      const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / rows));
      const rgb = dominantRgb(data, width, x0, y0, x1, y1);

      outContext.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      outContext.fillRect(
        col * pixelsPerBead,
        row * pixelsPerBead,
        pixelsPerBead,
        pixelsPerBead,
      );
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("Unable to encode pixelated image."));
      },
      "image/png",
    );
  });

  return new File([blob], "grid.png", { type: "image/png" });
}

function dominantRgb(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const counts = new Map<
    string,
    { count: number; r: number; g: number; b: number }
  >();

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      // Quantize slightly so anti-aliased neighbors collapse together.
      const key = `${r >> 3},${g >> 3},${b >> 3}`;
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
        entry.r += r;
        entry.g += g;
        entry.b += b;
      } else {
        counts.set(key, { count: 1, r, g, b });
      }
    }
  }

  let best = { count: 0, r: 255, g: 255, b: 255 };
  for (const entry of counts.values()) {
    if (entry.count > best.count) {
      best = entry;
    }
  }

  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
  };
}
