import type { CanvasSize } from "@/config/canvas-sizes";
import { getBeadStats } from "@/features/bead/lib/bead-stats";
import { downloadTextFile } from "@/features/bead/lib/download-file";
import type { BeadTemplateFile } from "@/features/bead/lib/template-schema";
import type { BeadFill } from "@/features/bead/types";

type ExportBeadTemplateOptions = {
  size: CanvasSize;
  beads: readonly (BeadFill | null)[];
  filename: string;
};

export function exportBeadTemplate({
  size,
  beads,
  filename,
}: ExportBeadTemplateOptions) {
  const template: BeadTemplateFile = {
    version: 1,
    type: "bead-template",
    createdAt: new Date().toISOString(),
    title: `bead-${size.id}`,
    palette: "mard",
    size: {
      id: size.id,
      title: size.title,
      rows: size.rows,
      cols: size.cols,
    },
    beads: [...beads],
    stats: getBeadStats(beads),
  };

  downloadTextFile({
    filename,
    text: `${JSON.stringify(template, null, 2)}\n`,
    type: "application/json;charset=utf-8",
  });
}
