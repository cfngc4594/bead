import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { discoverRoutes } from "./features/discover/routes.js";

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: env.CORS_ORIGINS,
    }),
  )
  .get("/health", (c) => {
    return c.json({ status: "ok" as const });
  })
  .route("/discover", discoverRoutes)
  .onError((error, c) => {
    console.error("Unhandled API error", error);
    return c.json({ error: "Internal server error" }, 500);
  });

export type {
  DiscoverProject,
  PublishDiscoverProject,
} from "./features/discover/schema.js";

export type AppType = typeof app;

export default app;
