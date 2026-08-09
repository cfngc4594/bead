import {
  type BeadImageDisplayOptions,
  type BeadImageSvg,
  createBeadImageSvg,
} from "@bead/core/bead-image-svg";
import { downloadImageBlob } from "@/features/bead/lib/download-file";
import { compactCanvas } from "@/features/bead/storage/project-snapshots";
import type { BeadFill } from "@/features/bead/types";

type ExportBeadImageOptions = {
  beads: readonly (BeadFill | null)[];
  cols: number;
  displayOptions: BeadImageDisplayOptions;
  rows: number;
};

type DownloadBeadImageOptions = ExportBeadImageOptions & {
  filename: string;
};

const exportScale = 4;

export function createBeadImageBlob({
  rows,
  cols,
  beads,
  displayOptions,
}: ExportBeadImageOptions) {
  const image = createBeadImageSvg({
    rows,
    cols,
    displayOptions,
    snapshot: compactCanvas(beads),
  });

  return rasterizeSvg(image);
}

export async function exportBeadImage({
  filename,
  ...options
}: DownloadBeadImageOptions) {
  const blob = await createBeadImageBlob(options);
  await downloadImageBlob(blob, filename);
}

async function rasterizeSvg({ svg, width, height }: BeadImageSvg) {
  const canvas = document.createElement("canvas");
  canvas.width = width * exportScale;
  canvas.height = height * exportScale;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create export image.");
  }

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);

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
