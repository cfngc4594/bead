import { fileTypeFromBuffer } from "file-type";
import { NonRetriableError } from "inngest";
import { getObject } from "../storage/s3.js";

export const MAX_AI_UPLOAD_BYTES = 10 * 1024 * 1024;
const AI_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

export type AiImageObject = {
  bytes: Uint8Array;
  mime: string;
  ext: string;
};

export class InvalidAiImageError extends Error {}

export async function readAiImageUpload(file: File) {
  if (file.size === 0) {
    throw new InvalidAiImageError("图片文件为空");
  }
  if (file.size > MAX_AI_UPLOAD_BYTES) {
    throw new InvalidAiImageError("图片不能超过 10 MB");
  }

  const image = await parseAiImage(new Uint8Array(await file.arrayBuffer()));
  if (image.mime !== "image/jpeg") {
    throw new InvalidAiImageError("上传图片必须是 JPEG 格式");
  }
  return image;
}

export async function loadAiImageObject(
  objectKey: string,
): Promise<AiImageObject> {
  const bytes = await getObject(objectKey);
  try {
    return await parseAiImage(bytes);
  } catch (error) {
    if (error instanceof InvalidAiImageError) {
      throw new NonRetriableError(`${objectKey}: ${error.message}`, {
        cause: error,
      });
    }
    throw error;
  }
}

async function parseAiImage(bytes: Uint8Array): Promise<AiImageObject> {
  const detected = await fileTypeFromBuffer(bytes);

  if (!detected || !AI_IMAGE_MIME_TYPES.has(detected.mime)) {
    throw new InvalidAiImageError(
      `不支持的图片格式：${detected?.mime ?? "unknown"}`,
    );
  }

  return { bytes, mime: detected.mime, ext: detected.ext };
}

export function toDataUrl(image: AiImageObject) {
  return `data:${image.mime};base64,${Buffer.from(image.bytes).toString("base64")}`;
}
