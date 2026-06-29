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
  map.repeat.set(
    texture === "towel" || texture === "loofah" ? 3 : 2,
    texture === "towel" || texture === "loofah" ? 3 : 2,
  );
  map.needsUpdate = true;

  return map;
}

export function getSurfaceBumpScale(texture: MeltSurfaceTexture) {
  if (texture === "towel") {
    return 0.045;
  }

  if (texture === "loofah") {
    return 0.034;
  }

  if (texture === "mesh") {
    return 0.04;
  }

  if (texture === "crumpled") {
    return 0.038;
  }

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

  if (texture === "towel") {
    const angleBucket = Math.floor(x / 8) + Math.floor(y / 8) * 3;
    const angle = pseudoRandom(angleBucket, angleBucket + 9) * Math.PI;
    const fiberAxis = Math.cos(angle) * x + Math.sin(angle) * y;
    const fibers = Math.sin(fiberAxis * 1.55) * 32;
    const strokes =
      pseudoRandom(Math.floor(x / 3), Math.floor(y / 3)) > 0.48 ? 38 : -10;
    const knots = pseudoRandom(x + 31, y + 17) > 0.9 ? 44 : 0;

    return clampTextureValue(206 + fibers + strokes + noise * 22 + knots);
  }

  if (texture === "loofah") {
    const cellX = x % 10;
    const cellY = y % 10;
    const distanceFromCenter = Math.hypot(cellX - 5, cellY - 5);
    const pebble = distanceFromCenter < 3.2 ? 38 : -16;
    const softNoise = Math.sin((x + y) * 0.34) * 10;

    return clampTextureValue(206 + pebble + softNoise + noise * 22);
  }

  if (texture === "glossy") {
    const softBand = Math.sin((x + y) * 0.18) * 5;
    const sheen = x + y > 44 && x + y < 68 ? 26 : 0;

    return clampTextureValue(222 + softBand + sheen + noise * 8);
  }

  if (texture === "mesh") {
    const cellX = x % 12;
    const cellY = y % 12;
    const groove = cellX <= 2 || cellY <= 2 ? -44 : 0;
    const pillow =
      Math.sin((cellX / 12) * Math.PI) * Math.sin((cellY / 12) * Math.PI) * 58;

    return clampTextureValue(196 + groove + pillow + noise * 10);
  }

  if (texture === "crumpled") {
    const foldA = Math.sin(x * 0.2 + y * 0.12) * 34;
    const foldB = Math.sin(x * -0.14 + y * 0.28) * 28;
    const foldC = Math.sin(x * 0.34 - y * 0.18) * 18;
    const crease =
      pseudoRandom(Math.floor(x / 9), Math.floor(y / 6)) > 0.72 ? 40 : -8;

    return clampTextureValue(202 + foldA + foldB + foldC + crease + noise * 12);
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
