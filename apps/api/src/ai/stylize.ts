import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";
import { NonRetriableError } from "inngest";
import { toFile } from "openai";
import { createOpenAiImageClient } from "../openai/client.js";
import { putObject } from "../storage/s3.js";
import { loadAiImageObject } from "./image-input.js";
import { getStylizeOutputSize } from "./image-output-size.js";
import { getImageProvider, getQwenImageConfig } from "./image-provider-env.js";
import { stylizedObjectKey } from "./object-keys.js";
import { generateQwenImage } from "./qwen-image.js";

export function stylizePrompt(sizeId: CanvasSizeId) {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const beads = rows * cols;

  return [
    "Remove the background and keep only the main subject.",
    "Create a fuse-bead-ready pixel illustration on a solid pure white (#FFFFFF) background.",
    "Preserve the subject's distinctive silhouette, proportions, features, and signature colors.",
    `Use a chunky visual vocabulary suitable for a ${rows}x${cols} grid (${beads} cells).`,
    `Compose the illustration as exactly ${rows} rows by ${cols} columns of uniform square color blocks aligned to the image edges.`,
    "Use hard flat color blocks with strong contrast. Avoid gradients, soft shading, fine texture, and photographic detail.",
    "Add a clean solid black outline around the subject silhouette and major features.",
    "Center the complete subject and fill most of the frame. Do not draw grid lines, bead holes, props, text, shadows, or extra objects.",
  ].join(" ");
}

export async function stylizeImage(
  jobId: string,
  sourceKey: string,
  sizeId: CanvasSizeId,
) {
  const source = await loadAiImageObject(sourceKey);
  const key = stylizedObjectKey(jobId);

  if (getImageProvider() === "qwen") {
    const generated = await generateQwenImage({
      config: getQwenImageConfig(),
      source,
      prompt: stylizePrompt(sizeId),
    });
    await putObject(key, generated.bytes, generated.contentType);
    return key;
  }

  const image = await toFile(
    Buffer.from(source.bytes),
    `source.${source.ext}`,
    { type: source.mime },
  );
  const { model, openai } = createOpenAiImageClient();

  const result = await openai.images.edit({
    model,
    image,
    prompt: stylizePrompt(sizeId),
    background: "opaque",
    output_format: "png",
    quality: "high",
    size: getStylizeOutputSize(sizeId),
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new NonRetriableError("gpt-image-2 returned no stylized image data");
  }

  await putObject(key, Buffer.from(b64, "base64"), "image/png");
  return key;
}
