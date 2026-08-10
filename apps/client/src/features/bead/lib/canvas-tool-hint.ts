export type CanvasToolLayout = "desktop" | "mobile";

export function shouldShowTransientCanvasToolHint({
  layout,
  pointerType,
}: {
  layout: CanvasToolLayout;
  pointerType: string | null;
}) {
  return (
    layout === "mobile" || pointerType === "touch" || pointerType === "pen"
  );
}
