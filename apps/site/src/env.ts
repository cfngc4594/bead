import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SITE_GITHUB_URL: z.url(),
    VITE_SITE_WEB_APP_URL: z.url(),
    VITE_SITE_ANDROID_URL: z.url().optional(),
    VITE_SITE_IOS_URL: z.url().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  isServer: false,
});
