import type { ProjectV1, ProjectV1SnapshotCell } from "../v1/types";
import type { ProjectV2, ProjectV2Snapshot } from "./types";

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
): ProjectV2Snapshot {
  return {
    cells: snapshot.map(({ fill, index }) => [index, fill.code]),
    layers: [
      {
        id: BASE_LAYER_ID,
        name: BASE_LAYER_NAME,
      },
    ],
    activeLayerId: BASE_LAYER_ID,
  };
}
