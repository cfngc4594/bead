import type { z } from "zod";
import type { projectV1Schema, projectV1SnapshotCellSchema } from "./schema";

export type ProjectV1SnapshotCell = z.infer<typeof projectV1SnapshotCellSchema>;

export type ProjectV1 = z.infer<typeof projectV1Schema>;
