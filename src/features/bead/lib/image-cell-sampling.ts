import type { RgbColor } from "@/features/bead/lib/bead-color-match";

export type SampleMode = "average" | "dominant";

export type SampledCell = {
  rgb: RgbColor;
  alphaShare: number;
};

const alphaThreshold = 24;
const histogramStep = 24;

export function sampleCells(
  imageData: ImageData,
  rows: number,
  cols: number,
  mode: SampleMode,
) {
  const cells: SampledCell[] = [];
  const cellWidth = imageData.width / cols;
  const cellHeight = imageData.height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x0 = Math.floor(col * cellWidth);
      const y0 = Math.floor(row * cellHeight);
      const x1 = Math.max(x0 + 1, Math.ceil((col + 1) * cellWidth));
      const y1 = Math.max(y0 + 1, Math.ceil((row + 1) * cellHeight));

      cells.push(sampleCell(imageData, x0, y0, x1, y1, mode));
    }
  }

  return cells;
}

function sampleCell(
  imageData: ImageData,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  mode: SampleMode,
): SampledCell {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let opaqueCount = 0;
  const histogram = new Map<
    string,
    { count: number; r: number; g: number; b: number }
  >();
  const data = imageData.data;
  const width = imageData.width;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];

      if (alpha < alphaThreshold) {
        continue;
      }

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      opaqueCount += 1;
      rSum += r;
      gSum += g;
      bSum += b;

      if (mode === "dominant") {
        const key = [
          quantizeChannel(r, histogramStep),
          quantizeChannel(g, histogramStep),
          quantizeChannel(b, histogramStep),
        ].join(",");
        const bucket = histogram.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        histogram.set(key, bucket);
      }
    }
  }

  if (opaqueCount === 0) {
    return {
      alphaShare: 0,
      rgb: { r: 255, g: 255, b: 255 },
    };
  }

  const averageRgb = {
    r: Math.round(rSum / opaqueCount),
    g: Math.round(gSum / opaqueCount),
    b: Math.round(bSum / opaqueCount),
  };

  if (mode === "average" || histogram.size === 0) {
    return {
      alphaShare: opaqueCount / ((x1 - x0) * (y1 - y0)),
      rgb: averageRgb,
    };
  }

  const dominant = [...histogram.values()].sort((a, b) => b.count - a.count)[0];

  return {
    alphaShare: opaqueCount / ((x1 - x0) * (y1 - y0)),
    rgb: {
      r: Math.round(dominant.r / dominant.count),
      g: Math.round(dominant.g / dominant.count),
      b: Math.round(dominant.b / dominant.count),
    },
  };
}

function quantizeChannel(value: number, step: number) {
  return Math.max(0, Math.min(255, Math.round(value / step) * step));
}
