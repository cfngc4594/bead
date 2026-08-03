import { runAiStep } from "../../ai/errors.js";
import { writeAiJob } from "../../ai/job-store.js";
import { rasterizeBeadPattern } from "../../ai/rasterize.js";
import { stylizeImage } from "../../ai/stylize.js";
import { inngest } from "../client.js";
import { aiImagePipelineRequested } from "../events.js";

export const aiImagePipeline = inngest.createFunction(
  {
    id: "ai-image-pipeline",
    name: "AI Image Pipeline",
    idempotency: "event.data.jobId",
    retries: 2,
    triggers: [aiImagePipelineRequested],
    onFailure: async ({ event, error, logger }) => {
      const { jobId, sizeId } = event.data.event.data;
      logger.error("AI image pipeline failed", { error, jobId, sizeId });
      await writeAiJob(jobId, {
        status: "failed",
        sizeId,
        error: "AI 生成失败，请更换图片后重试",
      });
    },
  },
  async ({ event, step, logger }) => {
    const { jobId, objectKey, sizeId } = event.data;

    await step.run("mark-processing", () =>
      writeAiJob(jobId, { status: "processing", sizeId }),
    );

    const stylizedKey = await step.run("ai-stylize", async () =>
      runAiStep(objectKey, () => stylizeImage(jobId, objectKey, sizeId)),
    );

    logger.info("ai-stylize complete", {
      jobId,
      sizeId,
      stylizedObjectKey: stylizedKey,
    });

    const resultKey = await step.run("rasterize-bead-pattern", () =>
      runAiStep(stylizedKey, () =>
        rasterizeBeadPattern({
          jobId,
          imageObjectKey: stylizedKey,
          sizeId,
        }),
      ),
    );

    await step.run("mark-completed", () =>
      writeAiJob(jobId, { status: "completed", sizeId, resultKey }),
    );

    return {
      jobId,
      objectKey,
      sizeId,
      stylizedObjectKey: stylizedKey,
      resultObjectKey: resultKey,
    };
  },
);
