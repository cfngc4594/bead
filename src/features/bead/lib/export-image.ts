import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import { getBoardSize } from "@/features/bead/lib/canvas-geometry";
import type { BeadFill } from "@/features/bead/types";

type ExportBeadImageOptions = {
  rows: number;
  cols: number;
  beads: readonly (BeadFill | null)[];
  filename: string;
};

const exportScale = 4;

export function exportBeadImage({
  rows,
  cols,
  beads,
  filename,
}: ExportBeadImageOptions) {
  const boardSize = getBoardSize(rows, cols);
  const canvas = document.createElement("canvas");
  canvas.width = boardSize.width * exportScale;
  canvas.height = boardSize.height * exportScale;

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(exportScale, exportScale);
  drawBoard(context, rows, cols, beads);

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    downloadBlob(blob, filename);
  }, "image/png");
}

function downloadBlob(blob: Blob, filename: string) {
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
