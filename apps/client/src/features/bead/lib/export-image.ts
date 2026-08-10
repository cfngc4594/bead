import {
  type BeadImageSvg,
  createBeadImageSvgRenderer,
} from "@bead/core/bead-image-svg";
import { compactCanvas } from "@/features/bead/storage/project-snapshots";
import type { BeadFill } from "@/features/bead/types";

type PrepareBeadImageOptions = {
  beads: readonly (BeadFill | null)[];
  cols: number;
  rows: number;
};

const exportScale = 4;
const svgMimeType = "image/svg+xml;charset=utf-8";

export function prepareBeadImage({
  rows,
  cols,
  beads,
}: PrepareBeadImageOptions) {
  return createBeadImageSvgRenderer({
    rows,
    cols,
    snapshot: compactCanvas(beads),
  });
}

export function createBeadImageSvgBlob({ svg }: BeadImageSvg) {
  return new Blob([svg], { type: svgMimeType });
}

export async function createBeadImagePngBlob(image: BeadImageSvg) {
  const { width, height } = image;
  const canvas = document.createElement("canvas");
  canvas.width = width * exportScale;
  canvas.height = height * exportScale;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create export image.");
  }

  const objectUrl = URL.createObjectURL(createBeadImageSvgBlob(image));

  try {
    const image = await loadImage(objectUrl);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load export image."));
    image.src = source;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Unable to create export image."));
    }, "image/png");
  });
}
