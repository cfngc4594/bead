import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { api } from "@/lib/api";

export async function startAiImagePipeline({
  file,
  sizeId,
}: {
  file: File;
  sizeId: CanvasSizeId;
}) {
  const response = await api.ai.pipelines.$post({
    form: { file, sizeId },
  });

  if (!response.ok) {
    return throwResponseError(response, "启动 AI 生成失败");
  }

  const body = await response.json();
  return body.jobId;
}

export type AiJobResult =
  | { status: "pending" }
  | { status: "completed"; kind: "pattern"; snapshot: CanvasSnapshot }
  | { status: "completed"; kind: "sample" };

export async function fetchAiJob(jobId: string) {
  const response = await api.ai.jobs[":jobId"].$get({
    param: { jobId },
  });

  if (!response.ok) {
    return throwResponseError(response, "查询 AI 任务失败");
  }

  return response.json() as Promise<AiJobResult>;
}

export async function fetchAiJobSampleFile(jobId: string) {
  const response = await api.ai.jobs[":jobId"].sample.$get({
    param: { jobId },
  });

  if (!response.ok) {
    return throwResponseError(response, "下载采样图失败");
  }

  const blob = await response.blob();
  return new File([blob], "sample.png", { type: "image/png" });
}

export async function waitForAiJobResult(
  jobId: string,
  {
    intervalMs = 2000,
    timeoutMs = 20 * 60 * 1000,
  }: { intervalMs?: number; timeoutMs?: number } = {},
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const job = await fetchAiJob(jobId);
    if (job.status === "completed") {
      return job;
    }
    await sleep(intervalMs);
  }

  throw new Error("AI 生成超时，请稍后重试");
}

async function throwResponseError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let message = fallbackMessage;

  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      message = body.error;
    }
  } catch {
    // Infrastructure failures may return an empty or non-JSON response.
  }

  throw new Error(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
