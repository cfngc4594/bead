import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const openaiEnv = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1),
    /** OpenAI API base URL (or OpenAI-compatible proxy / gateway). */
    OPENAI_BASE_URL: z.url(),
    /** Multimodal model for small-canvas structured bead grids. */
    OPENAI_VISION_MODEL: z.string().min(1),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
