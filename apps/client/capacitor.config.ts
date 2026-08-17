import type { CapacitorConfig } from "@capacitor/cli";

const deployEnv = process.env.BEAD_DEPLOY_ENV;

const config: CapacitorConfig = {
  appId:
    deployEnv === "production"
      ? "com.massbug.bead"
      : deployEnv === "preview"
        ? "com.massbug.bead.preview"
        : "com.massbug.bead.development",
  appName:
    deployEnv === "production"
      ? "Bead"
      : deployEnv === "preview"
        ? "Bead Preview"
        : "Bead Development",
  webDir: "out",
  // Keep WebView page zoom off; canvas implements its own pinch zoom.
  zoomEnabled: false,
  server: {
    androidScheme: "https",
    hostname: "localhost",
  },
};

export default config;
