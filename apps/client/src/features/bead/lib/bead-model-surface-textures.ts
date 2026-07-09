import * as THREE from "three";
import type { MeltSurfaceTexture } from "@/features/bead/lib/bead-model-preview-modes";

export function createSurfaceTexture(texture: MeltSurfaceTexture) {
  const size = 64;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  if (context) {
    const imageData = context.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const value = getSurfaceTextureValue({ texture, x, y });

        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);
  }

  const map = new THREE.CanvasTexture(canvas);

  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  return map;
}

export function getSurfaceBumpScale(texture: MeltSurfaceTexture) {
  if (texture === "glossy") {
    return 0.0035;
  }

  return 0.006;
}

function getSurfaceTextureValue({
  texture,
  x,
  y,
}: {
  texture: MeltSurfaceTexture;
  x: number;
  y: number;
}) {
  const noise = pseudoRandom(x, y);

  if (texture === "glossy") {
    const softBand = Math.sin((x + y) * 0.18) * 5;
    const sheen = x + y > 44 && x + y < 68 ? 26 : 0;

    return clampTextureValue(222 + softBand + sheen + noise * 8);
  }

  const paperWave = Math.sin((x + y) * 0.68) * 10;
  const paperCross = Math.sin((x - y) * 0.64) * 8;

  return clampTextureValue(218 + paperWave + paperCross + noise * 10);
}

function clampTextureValue(value: number) {
  return Math.max(0, Math.min(255, value));
}

function pseudoRandom(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43_758.5453;

  return value - Math.floor(value);
}
