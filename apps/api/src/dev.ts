import { devEnv } from "./dev-env";
import { app } from "./index";

export default {
  port: devEnv.PORT,
  fetch: app.fetch,
};
