import type { z } from "zod";
import type {
  projectV2Schema,
  projectV2SnapshotCellSchema,
  projectV2SnapshotLayerSchema,
  projectV2SnapshotSchema,
} from "./schema";

export type ProjectV2SnapshotCell = z.infer<typeof projectV2SnapshotCellSchema>;
export type ProjectV2SnapshotLayer = z.infer<
  typeof projectV2SnapshotLayerSchema
>;
export type ProjectV2Snapshot = z.infer<typeof projectV2SnapshotSchema>;
export type ProjectV2 = z.infer<typeof projectV2Schema>;
