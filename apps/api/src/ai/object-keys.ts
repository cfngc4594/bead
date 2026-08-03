export function sourceObjectKey(jobId: string) {
  return `ai/${jobId}/source.jpg`;
}

export function stylizedObjectKey(jobId: string) {
  return `ai/${jobId}/stylized.png`;
}

export function resultObjectKey(jobId: string) {
  return `ai/${jobId}/result.json`;
}

export function jobObjectKey(jobId: string) {
  return `ai/${jobId}/job.json`;
}
