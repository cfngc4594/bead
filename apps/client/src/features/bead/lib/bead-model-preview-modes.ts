export type BeadPreviewMode =
  | "beads"
  | "standard"
  | "towel"
  | "loofah"
  | "glossy"
  | "mesh"
  | "crumpled";

export type MeltedBeadPreviewMode = Exclude<BeadPreviewMode, "beads">;

export type MeltSurfaceTexture =
  | "paper"
  | "towel"
  | "loofah"
  | "glossy"
  | "mesh"
  | "crumpled";

export type MeltProfile = {
  tileSize: number;
  height: number;
  cornerRadius: number;
  bevelSize: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  texture: MeltSurfaceTexture;
};

export const meltProfiles: Record<MeltedBeadPreviewMode, MeltProfile> = {
  standard: {
    tileSize: 1,
    height: 0.058,
    cornerRadius: 0,
    bevelSize: 0.008,
    roughness: 0.5,
    metalness: 0.01,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    texture: "paper",
  },
  towel: {
    tileSize: 1,
    height: 0.075,
    cornerRadius: 0,
    bevelSize: 0.006,
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.02,
    clearcoatRoughness: 0.9,
    texture: "towel",
  },
  loofah: {
    tileSize: 1,
    height: 0.064,
    cornerRadius: 0,
    bevelSize: 0.008,
    roughness: 0.66,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.68,
    texture: "loofah",
  },
  glossy: {
    tileSize: 1,
    height: 0.052,
    cornerRadius: 0,
    bevelSize: 0.006,
    roughness: 0.2,
    metalness: 0.02,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16,
    texture: "glossy",
  },
  mesh: {
    tileSize: 1,
    height: 0.066,
    cornerRadius: 0,
    bevelSize: 0.004,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.58,
    texture: "mesh",
  },
  crumpled: {
    tileSize: 1,
    height: 0.062,
    cornerRadius: 0,
    bevelSize: 0.006,
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.48,
    texture: "crumpled",
  },
};
