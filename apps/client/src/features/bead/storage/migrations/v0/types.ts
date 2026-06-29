import type { z } from "zod";
import type { projectV0Schema, projectV0SnapshotCellSchema } from "./schema";

export type ProjectV0SnapshotCell = z.infer<typeof projectV0SnapshotCellSchema>;

export type ProjectV0 = z.infer<typeof projectV0Schema>;
