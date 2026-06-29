import type { CanvasSizeId } from "@/config/canvas-sizes";
import type { CanvasSnapshot } from "@/features/bead/storage/project-snapshots";
import type { BeadFill } from "@/features/bead/types";

export type ProjectV0SnapshotCell = {
  index: number;
  fill: BeadFill;
};

type ProjectVersionBase = {
  id: string;
  title: string;
  sizeId: CanvasSizeId;
  rows: number;
  cols: number;
  snapshots: unknown[][];
  currentIndex: number;
  updatedAt: number;
};

export type ProjectV0 = Omit<ProjectVersionBase, "snapshots"> & {
  snapshots: ProjectV0SnapshotCell[][];
};

export type ProjectV1SnapshotCell = ProjectV0SnapshotCell;

export type ProjectV1 = Omit<ProjectVersionBase, "snapshots"> & {
  snapshots: ProjectV1SnapshotCell[][];
};

export type ProjectV2 = Omit<ProjectV1, "snapshots"> & {
  snapshots: CanvasSnapshot[];
};

export function isProjectV0(value: unknown): value is ProjectV0 {
  if (!isProjectVersionBase(value)) {
    return false;
  }

  return value.snapshots.every((snapshot) =>
    snapshot.every(isProjectV0SnapshotCell),
  );
}

export function isProjectV1(value: unknown): value is ProjectV1 {
  if (!isProjectVersionBase(value)) {
    return false;
  }

  return value.snapshots.every((snapshot) =>
    snapshot.every(isProjectV1SnapshotCell),
  );
}

function isProjectVersionBase(value: unknown): value is ProjectVersionBase {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.sizeId === "string" &&
    typeof value.rows === "number" &&
    typeof value.cols === "number" &&
    Array.isArray(value.snapshots) &&
    value.snapshots.every(Array.isArray) &&
    typeof value.currentIndex === "number" &&
    typeof value.updatedAt === "number"
  );
}

function isProjectV0SnapshotCell(
  value: unknown,
): value is ProjectV0SnapshotCell {
  if (!isRecord(value) || typeof value.index !== "number") {
    return false;
  }

  const { fill } = value;

  return (
    isRecord(fill) &&
    typeof fill.code === "string" &&
    typeof fill.hex === "string"
  );
}

function isProjectV1SnapshotCell(
  value: unknown,
): value is ProjectV1SnapshotCell {
  return isProjectV0SnapshotCell(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
