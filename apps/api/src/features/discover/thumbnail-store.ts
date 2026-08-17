import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { discoverProjects } from "../../db/schema.js";
import { getOptionalObject, putObject } from "../../storage/s3.js";
import { discoverThumbnailObjectKey } from "./object-keys.js";
import { renderDiscoverThumbnailPng } from "./thumbnail.js";

export async function storeDiscoverThumbnail({
  projectId,
  sizeId,
  snapshot,
}: {
  projectId: string;
  sizeId: CanvasSizeId;
  snapshot: CanvasSnapshot;
}) {
  const png = await renderDiscoverThumbnailPng({ sizeId, snapshot });
  await putObject(discoverThumbnailObjectKey(projectId), png, "image/png");
  return png;
}

export async function getDiscoverThumbnail(projectId: string) {
  const objectKey = discoverThumbnailObjectKey(projectId);
  const existing = await getOptionalObject(objectKey);

  if (existing) {
    return existing;
  }

  const [project] = await db
    .select({
      id: discoverProjects.id,
      sizeId: discoverProjects.sizeId,
      snapshot: discoverProjects.snapshot,
    })
    .from(discoverProjects)
    .where(eq(discoverProjects.id, projectId))
    .limit(1);

  if (!project) {
    return null;
  }

  return storeDiscoverThumbnail({
    projectId: project.id,
    sizeId: project.sizeId,
    snapshot: project.snapshot,
  });
}
