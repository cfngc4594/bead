import { z } from "zod";
import type { AiImageObject } from "./image-input.js";
import { toDataUrl } from "./image-input.js";

const qwenResponseSchema = z.object({
  output: z.object({
    choices: z.array(
      z.object({
        message: z.object({
          content: z.array(z.object({ image: z.string().url().optional() })),
        }),
      }),
    ),
  }),
});

export type QwenImageConfig = {
  apiKey: string;
  generationUrl: string;
  model: string;
};

type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class QwenImageError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "QwenImageError";
  }
}

export async function generateQwenImage({
  config,
  source,
  prompt,
  fetchFn = fetch,
}: {
  config: QwenImageConfig;
  source: AiImageObject;
  prompt: string;
  fetchFn?: FetchFn;
}) {
  const response = await fetchFn(config.generationUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: {
        messages: [
          {
            role: "user",
            content: [{ image: toDataUrl(source) }, { text: prompt }],
          },
        ],
      },
      parameters: { prompt_extend: true },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new QwenImageError(
      qwenErrorMessage(payload, response.status),
      response.status,
    );
  }

  const parsed = qwenResponseSchema.safeParse(payload);
  const imageUrl = parsed.success
    ? parsed.data.output.choices
        .flatMap((choice) => choice.message.content)
        .find((content) => content.image)?.image
    : undefined;
  if (!imageUrl) {
    throw new QwenImageError("Qwen returned no generated image URL");
  }

  const imageResponse = await fetchFn(imageUrl);
  if (!imageResponse.ok) {
    throw new QwenImageError(
      `Unable to download Qwen generated image: HTTP ${imageResponse.status}`,
      imageResponse.status,
    );
  }

  const contentType = imageResponse.headers
    .get("content-type")
    ?.split(";", 1)[0];
  if (!contentType?.startsWith("image/")) {
    throw new QwenImageError(
      "Qwen generated image download did not return an image content type",
    );
  }

  return {
    bytes: new Uint8Array(await imageResponse.arrayBuffer()),
    contentType,
  };
}

function qwenErrorMessage(payload: unknown, status: number) {
  const parsed = z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .safeParse(payload);
  const detail = parsed.success
    ? [parsed.data.code, parsed.data.message].filter(Boolean).join(": ")
    : "";
  return `Qwen image generation failed: HTTP ${status}${detail ? ` (${detail})` : ""}`;
}
