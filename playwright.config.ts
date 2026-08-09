import path from "node:path";
import { defineConfig } from "@playwright/test";

const viteExecutable = JSON.stringify(
  path.resolve(
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vite.exe" : "vite",
  ),
);

export default defineConfig({
  testDir: "./apps/client/e2e",
  testMatch: /.*\.e2e\.ts/,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["line"]] : "line",
  outputDir: "output/playwright/test-results",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `${viteExecutable} --config apps/client/vite.config.ts --host 127.0.0.1 --port 4173`,
    env: {
      ...process.env,
      VITE_API_URL: process.env.VITE_API_URL ?? "http://127.0.0.1:8787",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:4173/projects/new",
  },
});
