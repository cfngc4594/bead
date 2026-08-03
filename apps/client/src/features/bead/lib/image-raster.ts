const sourceMaxSide = 1400;

export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Unsupported image file.");
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image."));
    };
    image.src = url;
  });
}

export function renderImageToCanvas(
  image: HTMLImageElement,
  targetAspectRatio: number,
): ImageData {
  const sourceWidth = Math.max(1, image.naturalWidth);
  const sourceHeight = Math.max(1, image.naturalHeight);
  const sourceMaxDimension = Math.max(sourceWidth, sourceHeight);
  const canvasLongSide = Math.max(
    1,
    Math.round(Math.min(sourceMaxDimension, sourceMaxSide)),
  );
  const canvasWidth =
    targetAspectRatio >= 1
      ? Math.max(1, Math.round(canvasLongSide / targetAspectRatio))
      : canvasLongSide;
  const canvasHeight =
    targetAspectRatio >= 1
      ? canvasLongSide
      : Math.max(1, Math.round(canvasLongSide * targetAspectRatio));
  const fitScale = Math.min(
    canvasWidth / sourceWidth,
    canvasHeight / sourceHeight,
  );
  const drawWidth = Math.max(1, Math.round(sourceWidth * fitScale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * fitScale));
  const drawX = Math.floor((canvasWidth - drawWidth) / 2);
  const drawY = Math.floor((canvasHeight - drawHeight) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Unable to create canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return context.getImageData(0, 0, canvasWidth, canvasHeight);
}
