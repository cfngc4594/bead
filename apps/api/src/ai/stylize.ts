import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";
import { NonRetriableError } from "inngest";
import { toFile } from "openai";
import { GPT_IMAGE_2, openai } from "../openai/client.js";
import { putObject } from "../storage/s3.js";
import { loadAiImageObject } from "./image-input.js";
import { stylizedObjectKey } from "./object-keys.js";

/** gpt-image-2 rejects outputs below this many pixels. */
const MIN_OUTPUT_PIXELS = 655_360;
const MAX_OUTPUT_EDGE = 2048;

/**
 * Pick a square size that is an integer multiple of the bead grid and legal for
 * gpt-image-2 (edges ÷16, pixels ≥ min). Sampling then maps one bead ≈ one block.
 */
export function stylizeOutputSize(sizeId: CanvasSizeId): `${number}x${number}` {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  if (rows !== cols) {
    throw new NonRetriableError(`Non-square canvas not supported: ${sizeId}`);
  }

  const minEdge = Math.ceil(Math.sqrt(MIN_OUTPUT_PIXELS));
  const preferredPerBead = [16, 24, 32, 48, 64];

  for (const pixelsPerBead of preferredPerBead) {
    const edge = rows * pixelsPerBead;
    if (
      edge >= minEdge &&
      edge <= MAX_OUTPUT_EDGE &&
      edge % 16 === 0 &&
      edge * edge >= MIN_OUTPUT_PIXELS
    ) {
      return `${edge}x${edge}`;
    }
  }

  let pixelsPerBead = Math.ceil(minEdge / rows);
  while (
    pixelsPerBead > 0 &&
    ((rows * pixelsPerBead) % 16 !== 0 ||
      rows * pixelsPerBead < minEdge ||
      rows * pixelsPerBead > MAX_OUTPUT_EDGE)
  ) {
    pixelsPerBead += 1;
    if (rows * pixelsPerBead > MAX_OUTPUT_EDGE) {
      return "1024x1024";
    }
  }

  const edge = rows * pixelsPerBead;
  return `${edge}x${edge}`;
}

function stylizePrompt(sizeId: CanvasSizeId) {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const beads = rows * cols;

  return [
    "Edit this matted subject into a fuse-bead ready pixel illustration on a solid pure white (#FFFFFF) background.",
    `Keep the subject clearly recognizable — preserve distinctive silhouette, ear/limb shapes, and signature colors.`,
    `Target a chunky look suitable for later reduction to about ${rows}×${cols} beads (${beads} beads), but do not destroy identity.`,
    "Use hard flat color blocks with strong contrast. Avoid gradients, soft shading, fine texture, and photographic detail.",
    "Add a clean solid black outline around the subject silhouette and major features.",
    "Fill most of the frame with the subject; center it; no props, text, grid lines, shadows, or extra objects.",
  ].join(" ");
}

/**
 * Turn the matted subject into a bead-friendly pixel illustration.
 * Returns only the object key so Inngest step memoization stays small.
 */
export async function stylizeImage(
  jobId: string,
  mattedKey: string,
  sizeId: CanvasSizeId,
) {
  const source = await loadAiImageObject(mattedKey);
  const image = await toFile(
    Buffer.from(source.bytes),
    `matted.${source.ext}`,
    { type: source.mime },
  );

  const result = await openai.images.edit({
    model: GPT_IMAGE_2,
    image,
    prompt: stylizePrompt(sizeId),
    background: "opaque",
    output_format: "png",
    quality: "high",
    size: stylizeOutputSize(sizeId),
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new NonRetriableError("gpt-image-2 returned no stylized image data");
  }

  const key = stylizedObjectKey(jobId);
  await putObject(key, Buffer.from(b64, "base64"), "image/png");
  return key;
}
