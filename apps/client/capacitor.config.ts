import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.massbug.bead",
  appName: "Bead",
  webDir: "out",
  server: {
    androidScheme: "bead",
    hostname: "localhost",
  },
};

export default config;
