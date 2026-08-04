import {
  type CanvasSizeId,
  getCanvasSizeDefinition,
} from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { NonRetriableError } from "inngest";
import { putObject } from "../storage/s3.js";
import { loadAiImageObject } from "./image-input.js";
import { imageToCanvasSnapshot } from "./image-to-snapshot.js";
import { resultObjectKey } from "./object-keys.js";

export async function rasterizeBeadPattern({
  jobId,
  imageObjectKey,
  sizeId,
}: {
  jobId: string;
  imageObjectKey: string;
  sizeId: CanvasSizeId;
}) {
  const image = await loadAiImageObject(imageObjectKey);
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  let snapshot: CanvasSnapshot;

  try {
    snapshot = await imageToCanvasSnapshot(image.bytes, rows, cols);
  } catch (error) {
    throw new NonRetriableError("Unable to rasterize AI image", {
      cause: error,
    });
  }

  if (snapshot.cells.length === 0) {
    throw new NonRetriableError("Rasterized bead pattern is empty");
  }

  const key = resultObjectKey(jobId);
  await putObject(
    key,
    Buffer.from(`${JSON.stringify(snapshot)}\n`, "utf8"),
    "application/json",
  );
  return key;
}
