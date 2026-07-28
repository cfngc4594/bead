import { NonRetriableError } from "inngest";
import { objectExists } from "../../storage/s3.js";
import { inngest } from "../client.js";
import { aiImagePipelineRequested } from "../events.js";

export const aiImagePipeline = inngest.createFunction(
  {
    id: "ai-image-pipeline",
    name: "AI Image Pipeline",
    triggers: [aiImagePipelineRequested],
  },
  async ({ event, step, logger }) => {
    const { jobId, objectKey, options } = event.data;

    await step.run("verify-object", async () => {
      if (!(await objectExists(objectKey))) {
        throw new NonRetriableError(`Object not found: ${objectKey}`);
      }
    });

    await step.run("ai-matting", async () => {
      logger.info("ai-matting: not implemented", { objectKey });
      return null;
    });

    await step.run("ai-pixelate", async () => {
      logger.info("ai-pixelate: not implemented", { objectKey, options });
      return null;
    });

    return { jobId, objectKey };
  },
);
