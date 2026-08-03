import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const openaiEnv = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_BASE_URL: z.url().default("https://api.openai.com/v1"),
    OPENAI_IMAGE_MODEL: z.string().min(1).default("gpt-image-2"),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
