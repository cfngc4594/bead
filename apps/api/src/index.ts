import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "inngest/hono";
import { aiRoutes } from "./features/ai/routes.js";
import { discoverRoutes } from "./features/discover/routes.js";
import { functions, inngest } from "./inngest/index.js";
import { serverEnv } from "./server-env.js";

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: serverEnv.CORS_ORIGINS,
    }),
  )
  .get("/health", (c) => {
    return c.json({ status: "ok" as const });
  })
  .route("/ai", aiRoutes)
  .route("/discover", discoverRoutes)
  .on(
    ["GET", "PUT", "POST"],
    "/api/inngest",
    serve({
      client: inngest,
      functions,
    }),
  )
  .onError((error, c) => {
    console.error("Unhandled API error", error);
    return c.json({ error: "Internal server error" }, 500);
  });

export type AppType = typeof app;

export default app;
