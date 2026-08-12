import {
  Blend,
  Eraser,
  Hand,
  type LucideIcon,
  MousePointer2,
  PaintBucket,
  PenLine,
  Pipette,
} from "lucide-react";
import type { CanvasTool } from "@/features/bead/types";

type CanvasToolDefinition = {
  tool: CanvasTool;
  label: string;
  icon: LucideIcon;
};

export const canvasToolDefinitions: CanvasToolDefinition[] = [
  { icon: Hand, label: "平移", tool: "pan" },
  { icon: MousePointer2, label: "选择", tool: "select" },
  { icon: PenLine, label: "画笔", tool: "paint" },
  { icon: PaintBucket, label: "填充", tool: "fill" },
  { icon: Eraser, label: "橡皮", tool: "erase" },
  { icon: Blend, label: "混豆", tool: "mix" },
  { icon: Pipette, label: "吸管", tool: "picker" },
];
