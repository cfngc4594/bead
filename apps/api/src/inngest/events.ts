import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { eventType } from "inngest";
import { z } from "zod";

export const aiImagePipelineRequested = eventType(
  "ai/image.pipeline.requested",
  {
    schema: z.object({
      jobId: z.string().min(1),
      /** Object key after the client uploaded the local image to storage. */
      objectKey: z.string().min(1),
      sizeId: canvasSizeIdSchema,
    }),
  },
);
