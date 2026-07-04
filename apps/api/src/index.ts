import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: env.CORS_ORIGINS,
    }),
  )
  .get("/health", (c) => {
    return c.json({ status: "ok" as const });
  });

export type AppType = typeof app;

export default app;
