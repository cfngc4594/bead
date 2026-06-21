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

    canvas.width = boardSize.width * previewScale;
    canvas.height = boardSize.height * previewScale;

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(previewScale, previewScale);
    drawBoard(context, document.rows, document.cols, beads, {
      showBeadCodes: true,
      showGuideLines: false,
    });
  }, [document]);

  return (
    <canvas className="h-full w-full object-contain p-3" ref={canvasRef} />
  );
}
