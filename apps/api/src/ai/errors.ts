import { NoSuchKey } from "@aws-sdk/client-s3";
import { NonRetriableError } from "inngest";
import { APIError } from "openai";
import { QwenImageError } from "./qwen-image.js";

const RETRIABLE_CLIENT_STATUSES = new Set([408, 409, 429]);

export async function runAiStep<T>(
  objectKey: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof NonRetriableError) throw error;
    if (isNonRetriableAiError(error)) {
      throw new NonRetriableError(aiErrorMessage(error, objectKey), {
        cause: error,
      });
    }
    throw error;
  }
}

function aiErrorMessage(error: unknown, objectKey: string) {
  if (error instanceof NoSuchKey) {
    return `Object not found: ${objectKey}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function isNonRetriableAiError(error: unknown) {
  if (error instanceof NoSuchKey) return true;

  if (error instanceof APIError) {
    return isNonRetriableHttpStatus(error.status);
  }

  if (error instanceof QwenImageError) {
    return isNonRetriableHttpStatus(error.status);
  }

  const status = httpStatusOf(error);
  return isNonRetriableHttpStatus(status);
}

function isNonRetriableHttpStatus(status: number | undefined) {
  return (
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    !RETRIABLE_CLIENT_STATUSES.has(status)
  );
}

function httpStatusOf(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number")
    return error.status;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}
