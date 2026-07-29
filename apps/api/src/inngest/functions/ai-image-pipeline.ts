import { NoSuchKey } from "@aws-sdk/client-s3";
import { NonRetriableError } from "inngest";
import { APIError } from "openai";
import { mattImage } from "../../ai/matting.js";
import { inngest } from "../client.js";
import { aiImagePipelineRequested } from "../events.js";

/** Client/auth/validation failures — do not retry. */
const NON_RETRIABLE_HTTP_STATUSES = new Set([400, 401, 403, 404, 422]);

export const aiImagePipeline = inngest.createFunction(
  {
    id: "ai-image-pipeline",
    name: "AI Image Pipeline",
    triggers: [aiImagePipelineRequested],
  },
  async ({ event, step, logger }) => {
    const { jobId, objectKey, options } = event.data;

    const mattedObjectKey = await step.run("ai-matting", async () => {
      try {
        return await mattImage(jobId, objectKey);
      } catch (error) {
        if (error instanceof NonRetriableError) throw error;
        if (isNonRetriableError(error)) {
          throw new NonRetriableError(errorMessage(error, objectKey), {
            cause: error,
          });
        }
        throw error;
      }
    });

    logger.info("ai-matting complete", { jobId, objectKey, mattedObjectKey });

    await step.run("ai-pixelate", async () => {
      logger.info("ai-pixelate: not implemented", {
        objectKey: mattedObjectKey,
        options,
      });
      return null;
    });

    return { jobId, objectKey, mattedObjectKey };
  },
);

function errorMessage(error: unknown, objectKey: string) {
  if (error instanceof NoSuchKey) {
    return `Object not found: ${objectKey}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function isNonRetriableError(error: unknown) {
  if (error instanceof NoSuchKey) return true;

  if (error instanceof APIError) {
    return (
      error.status !== undefined &&
      NON_RETRIABLE_HTTP_STATUSES.has(error.status)
    );
  }

  // OpenAI-compatible proxies may throw plain errors with status/statusCode.
  const status = httpStatusOf(error);
  return status !== undefined && NON_RETRIABLE_HTTP_STATUSES.has(status);
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
