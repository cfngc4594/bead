import type { AppType } from "@bead/api";
import { hc } from "hono/client";
import { env } from "@/env";

export const api = hc<AppType>(env.VITE_API_URL);
