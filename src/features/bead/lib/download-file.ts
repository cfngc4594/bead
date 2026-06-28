import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Media } from "@capacitor-community/media";

const nativeAlbumName = "Bead";

export async function downloadBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    await shareNativeFile(blob, filename);
    return;
  }

  downloadBlobInBrowser(blob, filename);
}

export async function downloadImageBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    await shareNativeFile(blob, filename);
    return;
  }

  await downloadBlob(blob, filename);
}

export async function saveImageBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    await saveNativeImage(blob, filename);
    return;
  }

  await downloadImageBlob(blob, filename);
}

export async function shareImageBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      await shareNativeFile(blob, filename);
      return true;
    } catch (error) {
      if (!isShareCanceledError(error)) {
        throw error;
      }
      return false;
    }
  }

  return shareOrDownloadBlobInBrowser(blob, filename);
}

function downloadBlobInBrowser(blob: Blob, filename: string) {
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
  await shareNativeData(data, filename);
}

async function shareNativeData(data: string, filename: string) {
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

async function saveNativeImage(blob: Blob, filename: string) {
  await Media.savePhoto({
    albumIdentifier:
      Capacitor.getPlatform() === "android"
        ? await getAndroidAlbumPath()
        : undefined,
    fileName: stripFileExtension(filename),
    path: await blobToDataUrl(blob),
  });
}

async function getAndroidAlbumPath() {
  const { path } = await Media.getAlbumsPath();
  const albumIdentifier = `${path}/${nativeAlbumName}`;

  try {
    await Media.createAlbum({ name: nativeAlbumName });
  } catch (error) {
    if (!isAlbumAlreadyExistsError(error)) {
      throw error;
    }
  }

  return albumIdentifier;
}

async function shareOrDownloadBlobInBrowser(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return true;
    } catch (error) {
      if (!isShareCanceledError(error)) {
        throw error;
      }
      return false;
    }
  }

  downloadBlobInBrowser(blob, filename);
  return true;
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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to read exported file."));
        return;
      }

      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function isShareCanceledError(error: unknown) {
  if (error instanceof Error) {
    return error.message === "Share canceled";
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return error.message === "Share canceled";
  }

  return String(error) === "Share canceled";
}

function createSharePath(filename: string) {
  return `share-${Date.now().toString(36)}/${filename}`;
}

function isAlbumAlreadyExistsError(error: unknown) {
  return String(error).toLowerCase().includes("album already exists");
}

function stripFileExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}
