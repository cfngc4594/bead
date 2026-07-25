import {
  Blend,
  CircleDot,
  Eraser,
  Hand,
  type LucideIcon,
  MousePointer2,
  PenLine,
  Pipette,
} from "lucide-react";
import type { CanvasTool } from "@/features/bead/types";

export type DrawTool = Extract<
  CanvasTool,
  "paint" | "mix" | "erase" | "picker"
>;

export type DrawInstrument = "brush" | "erase" | "picker";

export type BeadFillMode = "normal" | "mix";

type ToolDefinition = {
  tool: CanvasTool;
  label: string;
  icon: LucideIcon;
};

type FlyoutOptionDefinition<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

export const drawInstrumentDefinitions: FlyoutOptionDefinition<DrawInstrument>[] =
  [
    { icon: PenLine, id: "brush", label: "画笔" },
    { icon: Eraser, id: "erase", label: "橡皮" },
    { icon: Pipette, id: "picker", label: "吸管" },
  ];

export const beadFillModeDefinitions: FlyoutOptionDefinition<BeadFillMode>[] = [
  { icon: CircleDot, id: "normal", label: "普通豆" },
  { icon: Blend, id: "mix", label: "混豆" },
];

export const drawTriggerDefinition = {
  icon: PenLine,
  label: "绘制",
};

export const panToolDefinition: ToolDefinition = {
  icon: Hand,
  label: "移动画布",
  tool: "pan",
};

export const selectToolDefinition: ToolDefinition = {
  icon: MousePointer2,
  label: "选择移动",
  tool: "select",
};

export const defaultDrawTool: DrawTool = "paint";

const legacyDrawToolDefinitions: ToolDefinition[] = [
  { icon: PenLine, label: "画笔", tool: "paint" },
  { icon: Blend, label: "混豆画笔", tool: "mix" },
  { icon: Eraser, label: "橡皮擦", tool: "erase" },
  { icon: Pipette, label: "吸管", tool: "picker" },
];

const toolDefinitionById = new Map<CanvasTool, ToolDefinition>([
  [panToolDefinition.tool, panToolDefinition],
  [selectToolDefinition.tool, selectToolDefinition],
  ...legacyDrawToolDefinitions.map(
    (definition) => [definition.tool, definition] as const,
  ),
]);

export function isDrawTool(tool: CanvasTool): tool is DrawTool {
  return (
    tool === "paint" || tool === "mix" || tool === "erase" || tool === "picker"
  );
}

export function getToolDefinition(tool: CanvasTool) {
  return toolDefinitionById.get(tool) ?? panToolDefinition;
}

export function resolveCanvasTool(
  instrument: DrawInstrument,
  beadFillMode: BeadFillMode,
): DrawTool {
  if (instrument === "erase") {
    return "erase";
  }

  if (instrument === "picker") {
    return "picker";
  }

  return beadFillMode === "mix" ? "mix" : "paint";
}

export function parseCanvasTool(tool: DrawTool): {
  instrument: DrawInstrument;
  beadFillMode: BeadFillMode;
} {
  switch (tool) {
    case "erase":
      return { beadFillMode: "normal", instrument: "erase" };
    case "picker":
      return { beadFillMode: "normal", instrument: "picker" };
    case "mix":
      return { beadFillMode: "mix", instrument: "brush" };
    default:
      return { beadFillMode: "normal", instrument: "brush" };
  }
}

export function getDrawTriggerDefinition(
  instrument: DrawInstrument,
  beadFillMode: BeadFillMode,
) {
  const canvasTool = resolveCanvasTool(instrument, beadFillMode);
  const definition = getToolDefinition(canvasTool);

  return {
    icon: definition.icon,
    label: definition.label,
  };
}

export function isBeadFillModeEnabled(instrument: DrawInstrument) {
  return instrument === "brush";
}
