import { fileTypeFromBuffer } from "file-type";
import { NonRetriableError } from "inngest";
import { getObject } from "../storage/s3.js";

/** AI pipeline upload contract (OpenAI image input). */
const AI_INPUT_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type AiImageObject = {
  bytes: Uint8Array;
  mime: string;
  ext: string;
};

export async function loadAiImageObject(
  objectKey: string,
): Promise<AiImageObject> {
  const bytes = await getObject(objectKey);
  const detected = await fileTypeFromBuffer(bytes);

  if (!detected || !AI_INPUT_MIME_TYPES.has(detected.mime)) {
    throw new NonRetriableError(
      `Unsupported image: ${detected?.mime ?? "unknown"} (expected png, jpeg, or webp)`,
    );
  }

  return { bytes, mime: detected.mime, ext: detected.ext };
}

export function toDataUrl(image: AiImageObject) {
  return `data:${image.mime};base64,${Buffer.from(image.bytes).toString("base64")}`;
}
