import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function downloadBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    await shareNativeFile(blob, filename);
    return;
  }

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

export async function downloadTextFile({
  text,
  filename,
  type,
}: {
  text: string;
  filename: string;
  type: string;
}) {
  await downloadBlob(new Blob([text], { type }), filename);
}

async function shareNativeFile(blob: Blob, filename: string) {
  const data = await blobToBase64(blob);

  const { uri } = await Filesystem.writeFile({
    data,
    directory: Directory.Cache,
    path: createSharePath(filename),
    recursive: true,
  });

  await Share.share({
    files: [uri],
    title: filename,
  });
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to read exported file."));
        return;
      }

      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function createSharePath(filename: string) {
  return `share-${Date.now().toString(36)}/${filename}`;
}
