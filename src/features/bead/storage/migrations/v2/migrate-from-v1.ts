import type { CanvasSnapshot } from "@/features/bead/storage/project-snapshots";
import type { ProjectV1, ProjectV1SnapshotCell } from "../v1/types";
import type { ProjectV2 } from "./types";

const BASE_LAYER_ID = "layer-base";
const BASE_LAYER_NAME = "图层 1";

export function migrateProjectV1ToV2(project: ProjectV1): ProjectV2 {
  return {
    ...project,
    snapshots: project.snapshots.map(migrateProjectV1SnapshotToV2),
  };
}

function migrateProjectV1SnapshotToV2(
  snapshot: ProjectV1SnapshotCell[],
): CanvasSnapshot {
  return {
    v: 2,
    c: snapshot.map(({ fill, index }) => [index, fill.code]),
    l: [
      {
        id: BASE_LAYER_ID,
        name: BASE_LAYER_NAME,
      },
    ],
    a: BASE_LAYER_ID,
  };
}
