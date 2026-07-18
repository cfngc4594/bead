import type * as THREE from "three";

const frontFacingStart = 0.15;
const frontFacingEnd = 0.65;
const opaqueFragment = "#include <opaque_fragment>";

type ShadingProfile = {
  frontPhysicalStrength: number;
  minimumReliefBrightness: number;
  reliefPower: number;
  sidePhysicalStrength: number;
};

const beadShadingProfile: ShadingProfile = {
  frontPhysicalStrength: 0.22,
  minimumReliefBrightness: 1,
  reliefPower: 1,
  sidePhysicalStrength: 0.5,
};

const pressedShadingProfile: ShadingProfile = {
  frontPhysicalStrength: 0.16,
  minimumReliefBrightness: 0.88,
  reliefPower: 4,
  sidePhysicalStrength: 0.5,
};

export function applyBeadModelPreviewShading(
  shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
) {
  applyColorPreservingShading(shader, beadShadingProfile);
}

export function applyPressedModelPreviewShading(
  shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
) {
  applyColorPreservingShading(shader, pressedShadingProfile);
}

function applyColorPreservingShading(
  shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
  profile: ShadingProfile,
) {
  const reliefFragment =
    profile.minimumReliefBrightness < 1
      ? `
float reliefBrightness = mix(${profile.minimumReliefBrightness.toFixed(2)}, 1.00, pow(viewFacing, ${profile.reliefPower.toFixed(2)}));
outgoingLight *= reliefBrightness;`
      : "";
  const colorPreservingFragment = `
float viewFacing = saturate(dot(geometryNormal, geometryViewDir));
float frontFacingWeight = smoothstep(${frontFacingStart.toFixed(2)}, ${frontFacingEnd.toFixed(2)}, viewFacing);
float shadingStrength = mix(${profile.sidePhysicalStrength.toFixed(2)}, ${profile.frontPhysicalStrength.toFixed(2)}, frontFacingWeight);
outgoingLight = mix(diffuseColor.rgb, outgoingLight, shadingStrength);
${reliefFragment}
${opaqueFragment}`;

  shader.fragmentShader = shader.fragmentShader.replace(
    opaqueFragment,
    colorPreservingFragment,
  );
}
