import { env } from "@/env";

export const siteLinks = {
  github: env.VITE_SITE_GITHUB_URL,
  webApp: env.VITE_SITE_WEB_APP_URL,
  android: env.VITE_SITE_ANDROID_URL ?? "#android",
  ios: env.VITE_SITE_IOS_URL ?? "#ios",
} as const;
