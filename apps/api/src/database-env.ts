import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const databaseEnv = createEnv({
  server: {
    DATABASE_URL: z
      .url()
      .refine(
        (value) =>
          ["postgres:", "postgresql:"].includes(new URL(value).protocol),
        "DATABASE_URL must use the postgres or postgresql protocol",
      ),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
