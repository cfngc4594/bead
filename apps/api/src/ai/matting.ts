import { fileTypeFromBuffer } from "file-type";
import { NonRetriableError } from "inngest";
import { toFile } from "openai";
import { GPT_IMAGE_2, openai } from "../openai/client.js";
import { getObject, putObject } from "../storage/s3.js";

/**
 * AI pipeline upload contract (OpenAI gpt-image input).
 * Clients should normalize device photos to one of these before upload.
 */
const AI_INPUT_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** gpt-image-2 cannot emit alpha; isolate the subject on solid white instead. */
const MATTING_PROMPT = [
  "Remove the background completely.",
  "Keep only the main subject, preserving its exact shape, proportions, colors, texture, and fine edge detail.",
  "Place the subject on a solid pure white (#FFFFFF) background with no shadows, gradients, props, or extra objects.",
  "Do not crop, restyle, or invent parts of the subject.",
].join(" ");

export function mattedObjectKey(jobId: string) {
  return `ai/${jobId}/matted.png`;
}

/**
 * Isolate the subject from `sourceObjectKey` via gpt-image-2 edits, then store
 * the result under `ai/{jobId}/matted.png`. Returns only the object key (never
 * image bytes) so Inngest step memoization stays small.
 */
export async function mattImage(jobId: string, sourceObjectKey: string) {
  const source = await getObject(sourceObjectKey);
  const detected = await fileTypeFromBuffer(source);

  if (!detected || !AI_INPUT_MIME_TYPES.has(detected.mime)) {
    throw new NonRetriableError(
      `Unsupported image for matting: ${detected?.mime ?? "unknown"} (expected png, jpeg, or webp)`,
    );
  }

  const image = await toFile(Buffer.from(source), `source.${detected.ext}`, {
    type: detected.mime,
  });

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
