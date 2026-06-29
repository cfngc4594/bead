import type { z } from "zod";
import type { projectV2Schema } from "./schema";

export type ProjectV2 = z.infer<typeof projectV2Schema>;
