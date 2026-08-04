import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import { api } from "@/lib/api";

export async function startAiImageJob({
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

export async function fetchAiImageJob(jobId: string, signal?: AbortSignal) {
  const response = await api.ai.jobs[":jobId"].$get(
    { param: { jobId } },
    { init: { signal } },
  );

  if (!response.ok) {
    return throwResponseError(response, "查询 AI 任务失败");
  }

  return response.json();
}

export async function waitForAiImageJob(
  jobId: string,
  {
    intervalMs = 2000,
    timeoutMs = 20 * 60 * 1000,
    signal,
  }: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {},
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const job = await fetchAiImageJob(jobId, signal);
    if (job.status === "completed") {
      return job.snapshot;
    }
    if (job.status === "failed") {
      throw new Error(job.error);
    }
    await sleep(intervalMs, signal);
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

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleAbort = () => {
      clearTimeout(timeout);
      reject(signal?.reason);
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}
