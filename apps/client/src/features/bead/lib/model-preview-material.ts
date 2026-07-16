import type * as THREE from "three";

const frontPhysicalShadingStrength = 0.16;
const sidePhysicalShadingStrength = 0.5;
const frontFacingStart = 0.15;
const frontFacingEnd = 0.65;
const opaqueFragment = "#include <opaque_fragment>";

export function applyColorPreservingModelPreviewShading(
  shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
) {
  const colorPreservingFragment = `
float viewFacing = saturate(dot(geometryNormal, geometryViewDir));
float frontFacingWeight = smoothstep(${frontFacingStart.toFixed(2)}, ${frontFacingEnd.toFixed(2)}, viewFacing);
float shadingStrength = mix(${sidePhysicalShadingStrength.toFixed(2)}, ${frontPhysicalShadingStrength.toFixed(2)}, frontFacingWeight);
outgoingLight = mix(diffuseColor.rgb, outgoingLight, shadingStrength);
${opaqueFragment}`;

  shader.fragmentShader = shader.fragmentShader.replace(
    opaqueFragment,
    colorPreservingFragment,
  );
}
