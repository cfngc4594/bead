import type { BeadFill } from "@/features/bead/types";

export type BeadModelInstance = {
  hex: string;
  x: number;
  y: number;
};

export function createBeadModelInstances({
  rows,
  cols,
  beads,
}: {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
}): BeadModelInstance[] {
  const instances: BeadModelInstance[] = [];
  const xOffset = (cols - 1) / 2;
  const yOffset = (rows - 1) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const bead = beads[row * cols + col];

      if (!bead) {
        continue;
      }

      instances.push({
        hex: bead.hex.toLowerCase(),
        x: col - xOffset,
        y: yOffset - row,
      });
    }
  }

  return instances;
}

export function getModelCameraDistance({
  rows,
  cols,
  viewportWidth,
  viewportHeight,
  verticalFovDegrees,
  padding = 1.12,
}: {
  rows: number;
  cols: number;
  viewportWidth: number;
  viewportHeight: number;
  verticalFovDegrees: number;
  padding?: number;
}) {
  const safeViewportWidth = Math.max(1, viewportWidth);
  const safeViewportHeight = Math.max(1, viewportHeight);
  const aspect = safeViewportWidth / safeViewportHeight;
  const verticalFov = (verticalFovDegrees * Math.PI) / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const paddedWidth = Math.max(1, cols) * padding;
  const paddedHeight = Math.max(1, rows) * padding;
  const distanceForWidth = paddedWidth / (2 * Math.tan(horizontalFov / 2));
  const distanceForHeight = paddedHeight / (2 * Math.tan(verticalFov / 2));

  return Math.max(distanceForWidth, distanceForHeight);
}
