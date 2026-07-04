import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const devEnv = createEnv({
  server: {
    PORT: z.coerce.number().int().positive(),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});
