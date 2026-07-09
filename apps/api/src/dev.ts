import { devEnv } from "./dev-env.js";
import { app } from "./index.js";

export default {
  port: devEnv.PORT,
  fetch: app.fetch,
};
