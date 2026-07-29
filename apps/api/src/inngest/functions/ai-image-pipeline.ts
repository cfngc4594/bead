import { runAiStep } from "../../ai/errors.js";
import { generateBeadPattern } from "../../ai/bead-pattern.js";
import { mattImage } from "../../ai/matting.js";
import { sampleObjectKey } from "../../ai/object-keys.js";
import { shouldUseStructuredBeadPattern } from "../../ai/pipeline-mode.js";
import { stylizeImage } from "../../ai/stylize.js";
import { getObject, putObject } from "../../storage/s3.js";
import { inngest } from "../client.js";
import { aiImagePipelineRequested } from "../events.js";

export const aiImagePipeline = inngest.createFunction(
  {
    id: "ai-image-pipeline",
    name: "AI Image Pipeline",
    triggers: [aiImagePipelineRequested],
  },
  async ({ event, step, logger }) => {
    const { jobId, objectKey, sizeId } = event.data;

    const mattedKey = await step.run("ai-matting", async () =>
      runAiStep(objectKey, () => mattImage(jobId, objectKey)),
    );

    logger.info("ai-matting complete", { jobId, objectKey, mattedKey });

    if (shouldUseStructuredBeadPattern(sizeId)) {
      const patternKey = await step.run("ai-bead-pattern", async () =>
        runAiStep(mattedKey, () =>
          generateBeadPattern({
            jobId,
            imageObjectKey: mattedKey,
            sizeId,
          }),
        ),
      );

      logger.info("ai-bead-pattern complete", {
        jobId,
        sizeId,
        patternObjectKey: patternKey,
      });

      return {
        jobId,
        objectKey,
        sizeId,
        mode: "pattern" as const,
        mattedObjectKey: mattedKey,
        patternObjectKey: patternKey,
      };
    }

    const stylizedKey = await step.run("ai-stylize", async () =>
      runAiStep(mattedKey, () => stylizeImage(jobId, mattedKey, sizeId)),
    );

    logger.info("ai-stylize complete", {
      jobId,
      sizeId,
      stylizedObjectKey: stylizedKey,
    });

    const sampleKey = await step.run("ai-publish-sample", async () => {
      const bytes = await getObject(stylizedKey);
      return putObject(sampleObjectKey(jobId), bytes, "image/png");
    });

    return {
      jobId,
      objectKey,
      sizeId,
      mode: "sample" as const,
      mattedObjectKey: mattedKey,
      stylizedObjectKey: stylizedKey,
      sampleObjectKey: sampleKey,
    };
  },
);
