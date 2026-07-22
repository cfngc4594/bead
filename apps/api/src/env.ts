import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGINS: z.string().transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_URL: z.url(),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
