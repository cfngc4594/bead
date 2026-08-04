import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { eventType } from "inngest";
import { z } from "zod";

export const aiImagePipelineRequested = eventType(
  "ai/image.pipeline.requested",
  {
    schema: z.object({
      jobId: z.uuid(),
      objectKey: z.string().min(1),
      sizeId: canvasSizeIdSchema,
    }),
  },
);
