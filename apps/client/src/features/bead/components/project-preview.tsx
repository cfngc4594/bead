import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { resolveBoardTheme } from "@/features/bead/lib/board-theme";
import { drawBoard } from "@/features/bead/lib/canvas-drawing";
import { getPatternSize } from "@/features/bead/lib/canvas-geometry";
import type { Project } from "@/features/bead/storage/projects";
import { getCurrentCanvas } from "@/features/bead/storage/projects";

type ProjectPreviewProps = {
  project: Project;
};

const previewScale = 2;
const previewPadding = 4;

export function ProjectPreview({ project }: ProjectPreviewProps) {
  const { theme } = useTheme();
  const boardTheme = resolveBoardTheme(theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const patternSize = getPatternSize(project.rows, project.cols);
    const beads = getCurrentCanvas({
      cellCount: project.rows * project.cols,
      project,
    });
    const context = canvas.getContext("2d");

    canvas.width = (patternSize.width + previewPadding * 2) * previewScale;
    canvas.height = (patternSize.height + previewPadding * 2) * previewScale;

    if (!context) {
      return;
    }

    context.scale(previewScale, previewScale);
    context.translate(previewPadding, previewPadding);
    drawBoard(context, project.rows, project.cols, beads, {
      showBeadCodes: false,
      showGuideLines: false,
      showGrid: false,
      showLabels: false,
      theme: boardTheme,
    });
  }, [boardTheme, project]);

  return (
    <canvas className="h-full w-full object-contain p-3" ref={canvasRef} />
  );
}
