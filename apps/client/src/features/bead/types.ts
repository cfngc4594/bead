export type CanvasTool =
  | "pan"
  | "paint"
  | "mix"
  | "erase"
  | "picker"
  | "select";

export type CanvasView = {
  x: number;
  y: number;
  scale: number;
};

export type GridCell = {
  row: number;
  column: number;
};

export type BeadFill = {
  code: string;
  hex: string;
};

export type Viewport = {
  width: number;
  height: number;
};
