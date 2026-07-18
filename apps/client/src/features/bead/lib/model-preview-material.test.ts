import { expect, test } from "bun:test";
import {
  applyBeadModelPreviewShading,
  applyPressedModelPreviewShading,
} from "./model-preview-material";

function createShader() {
  return {
    fragmentShader: "void main() {\n#include <opaque_fragment>\n}",
  } as Parameters<typeof applyBeadModelPreviewShading>[0];
}

test("preserves bead color while retaining side shading", () => {
  const shader = createShader();

  applyBeadModelPreviewShading(shader);

  expect(shader.fragmentShader).toContain(
    "float viewFacing = saturate(dot(geometryNormal, geometryViewDir));",
  );
  expect(shader.fragmentShader).toContain(
    "float frontFacingWeight = smoothstep(0.15, 0.65, viewFacing);",
  );
  expect(shader.fragmentShader).toContain(
    "float shadingStrength = mix(0.50, 0.22, frontFacingWeight);",
  );
  expect(shader.fragmentShader).not.toContain("reliefBrightness");
  expect(shader.fragmentShader).toContain("#include <opaque_fragment>");
});

test("adds centered relief contrast to pressed surfaces", () => {
  const shader = {
    fragmentShader: "void main() {\n#include <opaque_fragment>\n}",
  } as Parameters<typeof applyPressedModelPreviewShading>[0];

  applyPressedModelPreviewShading(shader);

  expect(shader.fragmentShader).toContain(
    "float shadingStrength = mix(0.50, 0.16, frontFacingWeight);",
  );
  expect(shader.fragmentShader).toContain(
    "float reliefBrightness = mix(0.88, 1.00, pow(viewFacing, 4.00));",
  );
  expect(shader.fragmentShader).toContain("outgoingLight *= reliefBrightness;");
});
