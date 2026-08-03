import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import {
  InvalidAiImageError,
  MAX_AI_UPLOAD_BYTES,
} from "../../ai/image-input.js";
import { findAiImageJob, startAiImageJob } from "./service.js";

const MAX_MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

const startPipelineBodySchema = z.object({
  sizeId: canvasSizeIdSchema,
  file: z.instanceof(File),
});

const jobParamSchema = z.object({
  jobId: z.uuid(),
});

export const aiRoutes = new Hono()
  .post(
    "/pipelines",
    bodyLimit({
      maxSize: MAX_AI_UPLOAD_BYTES + MAX_MULTIPART_OVERHEAD_BYTES,
      onError: (c) => c.json({ error: "图片不能超过 10 MB" }, 413),
    }),
    zValidator("form", startPipelineBodySchema),
    async (c) => {
      const { sizeId, file } = c.req.valid("form");

      try {
        const jobId = await startAiImageJob({ file, sizeId });
        return c.json({ jobId }, 202);
      } catch (error) {
        if (error instanceof InvalidAiImageError) {
          return c.json({ error: error.message }, 400);
        }
        throw error;
      }
    },
  )
  .get("/jobs/:jobId", zValidator("param", jobParamSchema), async (c) => {
    const { jobId } = c.req.valid("param");
    const job = await findAiImageJob(jobId);

    if (!job) {
      return c.json({ error: "AI job not found" }, 404);
    }

    return c.json(job);
  });
