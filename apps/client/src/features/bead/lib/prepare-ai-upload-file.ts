import { loadImageFile } from "@/features/bead/lib/image-raster";

const AI_UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Normalize any browser-decodable image into an AI-pipeline upload file. */
export async function prepareAiUploadFile(file: File): Promise<File> {
  if (AI_UPLOAD_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImageFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, image.naturalWidth);
  canvas.height = Math.max(1, image.naturalHeight);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create canvas.");
  }

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("Unable to encode image."));
      },
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], "upload.jpg", { type: "image/jpeg" });
}
