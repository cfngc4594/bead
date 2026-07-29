import { NoSuchKey } from "@aws-sdk/client-s3";
import { canvasSnapshotSchema } from "@bead/core/canvas-snapshot";
import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  beadPatternObjectKey,
  sampleObjectKey,
  sourceObjectKey,
} from "../../ai/object-keys.js";
import { aiImagePipelineRequested } from "../../inngest/events.js";
import { inngest } from "../../inngest/index.js";
import {
  getObject,
  objectExists,
  putObject,
} from "../../storage/s3.js";

const startPipelineBodySchema = z.object({
  sizeId: canvasSizeIdSchema,
  file: z.instanceof(File),
});

const jobParamSchema = z.object({
  jobId: z.string().min(1),
});

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const aiRoutes = new Hono()
  .post(
    "/pipelines",
    zValidator("form", startPipelineBodySchema),
    async (c) => {
      const { sizeId, file } = c.req.valid("form");

      if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
        return c.json({ error: "仅支持 png、jpeg、webp 图片" }, 400);
      }

      const ext = extensionForMime(file.type);
      const jobId = crypto.randomUUID();
      const objectKey = sourceObjectKey(jobId, ext);
      const bytes = new Uint8Array(await file.arrayBuffer());

      await putObject(objectKey, bytes, file.type);
      await inngest.send(
        aiImagePipelineRequested.create({
          jobId,
          objectKey,
          sizeId,
        }),
      );

      return c.json({ jobId }, 202);
    },
  )
  .get("/jobs/:jobId", zValidator("param", jobParamSchema), async (c) => {
    const { jobId } = c.req.valid("param");

    if (await objectExists(beadPatternObjectKey(jobId))) {
      const bytes = await getObject(beadPatternObjectKey(jobId));
      const json: unknown = JSON.parse(new TextDecoder().decode(bytes));
      const snapshot = canvasSnapshotSchema.parse(json);
      return c.json({
        status: "completed" as const,
        kind: "pattern" as const,
        snapshot,
      });
    }

    if (await objectExists(sampleObjectKey(jobId))) {
      return c.json({
        status: "completed" as const,
        kind: "sample" as const,
      });
    }

    return c.json({ status: "pending" as const });
  })
  .get(
    "/jobs/:jobId/sample",
    zValidator("param", jobParamSchema),
    async (c) => {
      const { jobId } = c.req.valid("param");

      try {
        const bytes = await getObject(sampleObjectKey(jobId));
        return c.body(Buffer.from(bytes), 200, {
          "Content-Type": "image/png",
          "Cache-Control": "private, max-age=3600",
        });
      } catch (error) {
        if (error instanceof NoSuchKey) {
          return c.json({ error: "采样图尚未就绪" }, 404);
        }
        throw error;
      }
    },
  );

function extensionForMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}
