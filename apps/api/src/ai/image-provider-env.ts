import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const imageProviderSchema = z.enum(["openai", "qwen"]);

export const imageProviderEnv = createEnv({
  server: {
    AI_IMAGE_PROVIDER: imageProviderSchema.default("openai"),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_BASE_URL: z.url().default("https://api.openai.com/v1"),
    OPENAI_IMAGE_MODEL: z.string().min(1).default("gpt-image-2"),
    QWEN_API_KEY: z.string().min(1).optional(),
    QWEN_BASE_URL: z.url().optional(),
    QWEN_IMAGE_MODEL: z.string().min(1).default("qwen-image-3.0-pro"),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});

export type ImageProvider = z.infer<typeof imageProviderSchema>;

export function getImageProvider(): ImageProvider {
  return imageProviderEnv.AI_IMAGE_PROVIDER;
}

export function getOpenAiImageConfig() {
  return z
    .object({
      apiKey: z.string().min(1, "OPENAI_API_KEY is required for OpenAI"),
      baseURL: z.url(),
      model: z.string().min(1),
    })
    .parse({
      apiKey: imageProviderEnv.OPENAI_API_KEY,
      baseURL: imageProviderEnv.OPENAI_BASE_URL,
      model: imageProviderEnv.OPENAI_IMAGE_MODEL,
    });
}

export function getQwenImageConfig() {
  const config = z
    .object({
      apiKey: z.string().min(1, "QWEN_API_KEY is required for Qwen"),
      baseURL: z.url("QWEN_BASE_URL must be a valid URL"),
      model: z.string().min(1),
    })
    .parse({
      apiKey: imageProviderEnv.QWEN_API_KEY,
      baseURL: imageProviderEnv.QWEN_BASE_URL,
      model: imageProviderEnv.QWEN_IMAGE_MODEL,
    });

  return { ...config, generationUrl: qwenGenerationUrl(config.baseURL) };
}

export function validateImageProviderConfig() {
  if (getImageProvider() === "qwen") {
    getQwenImageConfig();
  } else {
    getOpenAiImageConfig();
  }
}

export function qwenGenerationUrl(baseURL: string) {
  return new URL(
    "services/aigc/multimodal-generation/generation",
    `${baseURL.replace(/\/$/, "")}/`,
  ).toString();
}

validateImageProviderConfig();
