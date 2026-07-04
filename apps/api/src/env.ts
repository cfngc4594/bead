import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.coerce.number().int().positive(),
    CORS_ORIGINS: z.string().transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  },
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
