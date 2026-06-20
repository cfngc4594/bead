export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile({
  text,
  filename,
  type,
}: {
  text: string;
  filename: string;
  type: string;
}) {
  downloadBlob(new Blob([text], { type }), filename);
}
