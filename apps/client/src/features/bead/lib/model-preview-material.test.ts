import { expect, test } from "bun:test";
import { applyColorPreservingModelPreviewShading } from "./model-preview-material";

test("preserves front-facing color while retaining side shading", () => {
  const shader = {
    fragmentShader: "void main() {\n#include <opaque_fragment>\n}",
  } as Parameters<typeof applyColorPreservingModelPreviewShading>[0];

  applyColorPreservingModelPreviewShading(shader);

  expect(shader.fragmentShader).toContain(
    "float viewFacing = saturate(dot(geometryNormal, geometryViewDir));",
  );
  expect(shader.fragmentShader).toContain(
    "float frontFacingWeight = smoothstep(0.15, 0.65, viewFacing);",
  );
  expect(shader.fragmentShader).toContain(
    "float shadingStrength = mix(0.50, 0.16, frontFacingWeight);",
  );
  expect(shader.fragmentShader).toContain(
    "outgoingLight = mix(diffuseColor.rgb, outgoingLight, shadingStrength);",
  );
  expect(shader.fragmentShader).toContain("#include <opaque_fragment>");
});
