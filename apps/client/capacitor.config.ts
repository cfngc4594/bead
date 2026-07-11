import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID ?? "com.massbug.bead",
  appName: process.env.CAPACITOR_APP_NAME ?? "Bead",
  webDir: "out",
  server: {
    androidScheme: "https",
    hostname: "localhost",
  },
};

export default config;
