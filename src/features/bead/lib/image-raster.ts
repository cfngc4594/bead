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
  const sourceAspectRatio = sourceHeight / sourceWidth;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    cropHeight = Math.round(sourceWidth * targetAspectRatio);
    cropY = Math.floor((sourceHeight - cropHeight) / 2);
  } else if (sourceAspectRatio < targetAspectRatio) {
    cropWidth = Math.round(sourceHeight / targetAspectRatio);
    cropX = Math.floor((sourceWidth - cropWidth) / 2);
  }

  const scale = Math.min(1, sourceMaxSide / Math.max(cropWidth, cropHeight));
  const canvasWidth = Math.max(1, Math.round(cropWidth * scale));
  const canvasHeight = Math.max(1, Math.round(cropHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Unable to create canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvasWidth,
    canvasHeight,
  );

  return context.getImageData(0, 0, canvasWidth, canvasHeight);
}
