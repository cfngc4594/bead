import { getMardColor } from "@bead/core/colors";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type BeadTemplateFile,
  beadTemplateSchema,
} from "@/features/bead/lib/template-schema";
import type { BeadFill } from "@/features/bead/types";

export class BeadTemplateImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BeadTemplateImportError";
  }
}

export function parseBeadTemplateFile({
  text,
  size,
}: {
  text: string;
  size: CanvasSize;
}) {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new BeadTemplateImportError("无法打开此文件");
  }

  const result = beadTemplateSchema.safeParse(data);

  if (!result.success) {
    throw new BeadTemplateImportError("不是有效的拼豆模板");
  }

  const template = result.data;

  if (template.size.rows !== size.rows || template.size.cols !== size.cols) {
    throw new BeadTemplateImportError(
      `请使用 ${template.size.rows}x${template.size.cols} 画布`,
    );
  }

  const cellCount = size.rows * size.cols;

  if (template.beads.length !== cellCount) {
    throw new BeadTemplateImportError("模板与画布不匹配");
  }

  return template.beads.map(normalizeBead);
}

function normalizeBead(
  bead: BeadTemplateFile["beads"][number],
): BeadFill | null {
  if (bead === null) {
    return null;
  }

  const color = getMardColor(bead.code);

  if (!color) {
    throw new BeadTemplateImportError(`不支持的颜色：${bead.code}`);
  }

  if (bead.hex.toLowerCase() !== color.hex.toLowerCase()) {
    throw new BeadTemplateImportError("颜色不匹配");
  }

  return {
    code: color.code,
    hex: color.hex,
  };
}
