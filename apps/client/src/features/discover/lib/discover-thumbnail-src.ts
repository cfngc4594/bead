export function discoverThumbnailSrc(thumbnailUrl: string, apiOrigin: string) {
  return new URL(thumbnailUrl, `${apiOrigin}/`).href;
}
