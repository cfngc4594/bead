import { canvasSizeIdSchema } from "@bead/core/canvas-sizes";
import { z } from "zod";
import { getOptionalObject, putObject } from "../storage/s3.js";
import { jobObjectKey } from "./object-keys.js";

const baseJobSchema = z.object({
  sizeId: canvasSizeIdSchema,
});

const aiJobSchema = z.discriminatedUnion("status", [
  baseJobSchema.extend({ status: z.literal("queued") }),
  baseJobSchema.extend({ status: z.literal("processing") }),
  baseJobSchema.extend({
    status: z.literal("completed"),
    resultKey: z.string().min(1),
  }),
  baseJobSchema.extend({
    status: z.literal("failed"),
    error: z.string().min(1),
  }),
]);

export type AiJob = z.infer<typeof aiJobSchema>;

export async function writeAiJob(jobId: string, job: AiJob) {
  await putObject(
    jobObjectKey(jobId),
    Buffer.from(`${JSON.stringify(job)}\n`, "utf8"),
    "application/json",
  );
}

export async function readAiJob(jobId: string) {
  const bytes = await getOptionalObject(jobObjectKey(jobId));
  if (!bytes) {
    return null;
  }

  return aiJobSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
}
