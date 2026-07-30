import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { getCanvasSizeDefinition } from "@bead/core/canvas-sizes";
import {
  type CanvasSnapshot,
  canvasSnapshotSchema,
  validateCanvasSnapshot,
} from "@bead/core/canvas-snapshot";
import { readAiImageUpload } from "../../ai/image-input.js";
import { readAiJob, writeAiJob } from "../../ai/job-store.js";
import { sourceObjectKey } from "../../ai/object-keys.js";
import { inngest } from "../../inngest/client.js";
import { aiImagePipelineRequested } from "../../inngest/events.js";
import { getObject, putObject } from "../../storage/s3.js";

export type AiJobView =
  | { status: "queued" | "processing" }
  | { status: "completed"; snapshot: CanvasSnapshot }
  | { status: "failed"; error: string };

export async function startAiImageJob({
  file,
  sizeId,
}: {
  file: File;
  sizeId: CanvasSizeId;
}) {
  const source = await readAiImageUpload(file);
  const jobId = crypto.randomUUID();
  const objectKey = sourceObjectKey(jobId);

  await putObject(objectKey, source.bytes, source.mime);
  await writeAiJob(jobId, { status: "queued", sizeId });
  await inngest.send(
    aiImagePipelineRequested.create({ jobId, objectKey, sizeId }),
  );

  return jobId;
}

export async function findAiImageJob(jobId: string): Promise<AiJobView | null> {
  const job = await readAiJob(jobId);
  if (!job) {
    return null;
  }

  if (job.status === "completed") {
    return {
      status: "completed",
      snapshot: parseSnapshot(await getObject(job.resultKey), job.sizeId),
    };
  }

  if (job.status === "failed") {
    return { status: "failed", error: job.error };
  }

  return { status: job.status };
}

function parseSnapshot(bytes: Uint8Array, sizeId: CanvasSizeId) {
  const snapshot = canvasSnapshotSchema.parse(
    JSON.parse(new TextDecoder().decode(bytes)),
  );
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const issues: string[] = [];

  validateCanvasSnapshot({
    snapshot,
    cellCount: rows * cols,
    path: [],
    addIssue: ({ message }) => issues.push(message),
  });

  if (issues.length > 0) {
    throw new Error(`Stored AI result is invalid: ${issues.join("; ")}`);
  }

  return snapshot;
}
