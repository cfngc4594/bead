import { env } from "./env";
import { app } from "./index";

export default {
  port: env.PORT,
  fetch: app.fetch,
};
