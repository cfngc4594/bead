import { z } from "zod";

export const discoverProjectParamSchema = z.object({
  projectId: z.uuid(),
});
