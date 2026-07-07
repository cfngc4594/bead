import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.url(),
    VITE_UMAMI_SCRIPT_URL: z.url().optional(),
    VITE_UMAMI_WEBSITE_ID: z.string().min(1).optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  isServer: false,
});
