import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { resolveBoardTheme } from "@/features/bead/lib/board-theme";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import { getPatternSize } from "@/features/bead/lib/canvas-geometry";
import type { CanvasSnapshot } from "@/features/bead/storage/project-schema";
import { expandSnapshot } from "@/features/bead/storage/project-snapshots";

type ProjectPreviewProps = {
  cols: number;
  rows: number;
  snapshot: CanvasSnapshot;
};

const previewScale = 2;
const previewPadding = 4;

export function ProjectPreview({ cols, rows, snapshot }: ProjectPreviewProps) {
  const { theme } = useTheme();
  const boardTheme = resolveBoardTheme(theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const patternSize = getPatternSize(rows, cols);
    const beads = expandSnapshot({
      cellCount: rows * cols,
      snapshot,
    });
    const context = canvas.getContext("2d");

    canvas.width = (patternSize.width + previewPadding * 2) * previewScale;
    canvas.height = (patternSize.height + previewPadding * 2) * previewScale;

    if (!context) {
      return;
    }

    context.scale(previewScale, previewScale);
    context.translate(previewPadding, previewPadding);
    drawBoard(context, rows, cols, beads, {
      showBeadCodes: false,
      showGuideLines: false,
      showGrid: false,
      showLabels: false,
      theme: boardTheme,
    });
  }, [boardTheme, cols, rows, snapshot]);

  return (
    <canvas className="h-full w-full object-contain p-3" ref={canvasRef} />
  );
}
