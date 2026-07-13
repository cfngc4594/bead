export const pressedModelPreviewModes = [
  {
    id: "towel",
    label: "毛巾烫",
    normalMapUrl: "/textures/towel-press-normal.jpg",
    normalScale: 1.55,
    patternSize: 18,
    previewUrl: "/textures/towel-press-preview.webp",
  },
  {
    id: "bath-towel",
    label: "澡巾烫",
    normalMapUrl: "/textures/bath-towel-press-normal.jpg",
    normalScale: 1.35,
    patternSize: 18,
    previewUrl: "/textures/bath-towel-press-preview.webp",
  },
  {
    id: "steam-cloth",
    label: "蒸布烫",
    normalMapUrl: "/textures/steam-cloth-press-normal.jpg",
    normalScale: 1.2,
    patternSize: 18,
    previewUrl: "/textures/steam-cloth-press-preview.webp",
  },
  {
    id: "waffle",
    label: "华夫格烫",
    normalMapUrl: "/textures/waffle-press-normal.jpg",
    normalScale: 1.4,
    patternSize: 18,
    previewUrl: "/textures/waffle-press-preview.webp",
  },
] as const;

export const modelPreviewModes = [
  { id: "beads", label: "摆豆" },
  ...pressedModelPreviewModes,
] as const;

export type ModelPreviewMode = (typeof modelPreviewModes)[number]["id"];
export type PressedModelPreviewMode = Exclude<ModelPreviewMode, "beads">;

export type ModelPreviewSettings = {
  lightIntensity: number;
  roughness: number;
  textureScale: number;
  textureStrength: number;
};

export const defaultModelPreviewSettings: ModelPreviewSettings = {
  lightIntensity: 1,
  roughness: 0.58,
  textureScale: 1,
  textureStrength: 1,
};

export function getPressedModelPreviewConfig(mode: PressedModelPreviewMode) {
  return pressedModelPreviewModes.find((item) => item.id === mode);
}
