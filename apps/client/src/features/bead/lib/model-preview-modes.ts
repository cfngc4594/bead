export const pressedModelPreviewModes = [
  {
    id: "towel",
    label: "毛巾烫",
    normalMapUrl: "/textures/towel-press-normal.jpg",
    normalScale: 1.55,
    patternSize: 18,
    roughness: 0.62,
  },
  {
    id: "bath-towel",
    label: "澡巾烫",
    normalMapUrl: "/textures/bath-towel-press-normal.jpg",
    normalScale: 1.35,
    patternSize: 18,
    roughness: 0.6,
  },
  {
    id: "steam-cloth",
    label: "蒸布烫",
    normalMapUrl: "/textures/steam-cloth-press-normal.jpg",
    normalScale: 1.2,
    patternSize: 18,
    roughness: 0.62,
  },
  {
    id: "waffle",
    label: "华夫格烫",
    normalMapUrl: "/textures/waffle-press-normal.jpg",
    normalScale: 1.4,
    patternSize: 18,
    roughness: 0.58,
  },
] as const;

export const modelPreviewModes = [
  { id: "beads", label: "摆豆" },
  ...pressedModelPreviewModes,
] as const;

export type ModelPreviewMode = (typeof modelPreviewModes)[number]["id"];
export type PressedModelPreviewMode = Exclude<ModelPreviewMode, "beads">;

export function getPressedModelPreviewConfig(mode: PressedModelPreviewMode) {
  return pressedModelPreviewModes.find((item) => item.id === mode);
}
