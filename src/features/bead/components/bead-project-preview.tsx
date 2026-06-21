"use client";

import { useEffect, useRef } from "react";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import { getBoardSize } from "@/features/bead/lib/canvas-geometry";
import type { BeadDocument } from "@/features/bead/storage/bead-documents";
import { getCurrentBeads } from "@/features/bead/storage/bead-documents";

type BeadProjectPreviewProps = {
  document: BeadDocument;
};

const previewScale = 2;
const previewPadding = 4;

export function BeadProjectPreview({ document }: BeadProjectPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const boardSize = getBoardSize(document.rows, document.cols);
    const beads = getCurrentBeads({
      cellCount: document.rows * document.cols,
      document,
    });
    const context = canvas.getContext("2d");

    canvas.width = (boardSize.width + previewPadding * 2) * previewScale;
    canvas.height = (boardSize.height + previewPadding * 2) * previewScale;

    if (!context) {
      return;
    }

    context.scale(previewScale, previewScale);
    context.translate(previewPadding, previewPadding);
    drawBoard(context, document.rows, document.cols, beads, {
      showBeadCodes: true,
      showGuideLines: false,
    });
  }, [document]);

  return (
    <canvas className="h-full w-full object-contain p-3" ref={canvasRef} />
  );
}
