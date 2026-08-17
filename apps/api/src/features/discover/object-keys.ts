export function discoverThumbnailObjectKey(projectId: string) {
  return `discover/${projectId}/thumb.png`;
}

export function discoverThumbnailPath(projectId: string) {
  return `/api/discover/${projectId}/thumbnail`;
}
