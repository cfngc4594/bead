import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";

const IMAGE_EDGE_MULTIPLE = 16;
const MIN_OUTPUT_PIXELS = 655_360;
const MAX_OUTPUT_PIXELS = 8_294_400;
const MAX_OUTPUT_EDGE = 3840;

export function getStylizeOutputSize(
  sizeId: CanvasSizeId,
): `${number}x${number}` {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const scaleStep = leastCommonMultiple(
    IMAGE_EDGE_MULTIPLE / greatestCommonDivisor(cols, IMAGE_EDGE_MULTIPLE),
    IMAGE_EDGE_MULTIPLE / greatestCommonDivisor(rows, IMAGE_EDGE_MULTIPLE),
  );
  const minimumScale = Math.ceil(Math.sqrt(MIN_OUTPUT_PIXELS / (rows * cols)));
  const scale = Math.ceil(minimumScale / scaleStep) * scaleStep;
  const width = cols * scale;
  const height = rows * scale;
  const pixels = width * height;

  if (
    width > MAX_OUTPUT_EDGE ||
    height > MAX_OUTPUT_EDGE ||
    pixels > MAX_OUTPUT_PIXELS ||
    Math.max(width, height) / Math.min(width, height) > 3
  ) {
    throw new Error(`Unsupported canvas size: ${sizeId}`);
  }

  return `${width}x${height}`;
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

function leastCommonMultiple(left: number, right: number) {
  return (left * right) / greatestCommonDivisor(left, right);
}
