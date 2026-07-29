export function sourceObjectKey(jobId: string, ext: string) {
  return `ai/${jobId}/source.${ext}`;
}

export function mattedObjectKey(jobId: string) {
  return `ai/${jobId}/matted.png`;
}

export function stylizedObjectKey(jobId: string) {
  return `ai/${jobId}/stylized.png`;
}

/** Final image the client samples into beads (large canvases). */
export function sampleObjectKey(jobId: string) {
  return `ai/${jobId}/sample.png`;
}

/** Structured bead pattern for small canvases. */
export function beadPatternObjectKey(jobId: string) {
  return `ai/${jobId}/pattern.json`;
}
