import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import { beadTemplateSchema } from "@/features/bead/lib/template-schema";
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
    throw new BeadTemplateImportError("文件不是有效的 JSON。");
  }

  const result = beadTemplateSchema.safeParse(data);

  if (!result.success) {
    throw new BeadTemplateImportError("文件不是有效的拼豆模板。");
  }

  const template = result.data;

  if (template.size.rows !== size.rows || template.size.cols !== size.cols) {
    throw new BeadTemplateImportError(
      `模板尺寸是 ${template.size.rows}x${template.size.cols}，请切换到 ${template.size.rows}x${template.size.cols} 画布后导入。`,
    );
  }

  const cellCount = size.rows * size.cols;

  if (template.beads.length !== cellCount) {
    throw new BeadTemplateImportError("模板格子数量和当前画布不匹配。");
  }

  return template.beads.map((bead, index) => normalizeBead(bead, index));
}

function normalizeBead(bead: unknown, index: number): BeadFill | null {
  if (bead === null) {
    return null;
  }

  if (!bead || typeof bead !== "object") {
    throw new BeadTemplateImportError(`第 ${index + 1} 格不是有效豆色。`);
  }

  const fill = bead as Partial<BeadFill>;

  if (typeof fill.code !== "string") {
    throw new BeadTemplateImportError(`第 ${index + 1} 格缺少豆色色号。`);
  }

  if (typeof fill.hex !== "string") {
    throw new BeadTemplateImportError(`第 ${index + 1} 格缺少豆色颜色值。`);
  }

  const color = mardColors.find((item) => item.code === fill.code);

  if (!color) {
    throw new BeadTemplateImportError(`不支持的豆色色号：${fill.code}`);
  }

  if (fill.hex.toLowerCase() !== color.hex.toLowerCase()) {
    throw new BeadTemplateImportError(`豆色色号 ${fill.code} 的颜色值不匹配。`);
  }

  return {
    code: color.code,
    hex: color.hex,
  };
}
