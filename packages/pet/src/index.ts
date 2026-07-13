import { registerPlugin } from "@capacitor/core";

export type PetInstance = {
  hex: string;
  x: number;
  y: number;
};

export type PetMode =
  | "beads"
  | "towel"
  | "bath-towel"
  | "steam-cloth"
  | "waffle";

export type PetSettings = {
  lightIntensity: number;
  roughness: number;
  textureScale: number;
  textureStrength: number;
};

export type PetConfig = {
  instances: PetInstance[];
  mode: PetMode;
  settings: PetSettings;
};

export type PetStatus = {
  permissionGranted: boolean;
  running: boolean;
  supported: boolean;
};

export type PetPlugin = {
  getStatus: () => Promise<PetStatus>;
  requestPermission: () => Promise<Pick<PetStatus, "permissionGranted">>;
  start: (options: { config: PetConfig }) => Promise<PetStatus>;
  stop: () => Promise<PetStatus>;
};

export const Pet = registerPlugin<PetPlugin>("Pet");
