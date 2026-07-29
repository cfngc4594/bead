import { NonRetriableError } from "inngest";
import { toFile } from "openai";
import { GPT_IMAGE_2, openai } from "../openai/client.js";
import { putObject } from "../storage/s3.js";
import { loadAiImageObject } from "./image-input.js";
import { mattedObjectKey } from "./object-keys.js";

/** gpt-image-2 cannot emit alpha; isolate the subject on solid white instead. */
const MATTING_PROMPT = [
  "Remove the background completely.",
  "Keep only the main subject, preserving its exact shape, proportions, colors, texture, and fine edge detail.",
  "Place the subject on a solid pure white (#FFFFFF) background with no shadows, gradients, props, or extra objects.",
  "Do not crop, restyle, or invent parts of the subject.",
].join(" ");

/**
 * Isolate the subject via gpt-image-2 edits and store under `ai/{jobId}/matted.png`.
 * Returns only the object key so Inngest step memoization stays small.
 */
export async function mattImage(jobId: string, sourceObjectKey: string) {
  const source = await loadAiImageObject(sourceObjectKey);
  const image = await toFile(
    Buffer.from(source.bytes),
    `source.${source.ext}`,
    {
      type: source.mime,
    },
  );

  const result = await openai.images.edit({
    model: GPT_IMAGE_2,
    image,
    prompt: MATTING_PROMPT,
    background: "opaque",
    output_format: "png",
    quality: "high",
    size: "auto",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new NonRetriableError("gpt-image-2 returned no image data");
  }

  const key = mattedObjectKey(jobId);
  await putObject(key, Buffer.from(b64, "base64"), "image/png");
  return key;
}
