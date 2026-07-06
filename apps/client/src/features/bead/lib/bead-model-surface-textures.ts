import * as THREE from "three";
import type { MeltSurfaceTexture } from "@/features/bead/lib/bead-model-preview-modes";

export function createSurfaceTexture(texture: MeltSurfaceTexture) {
  const size = texture === "towel" ? 96 : 64;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  if (context) {
    if (texture === "towel") {
      drawTowelSurfaceTexture(context, size);
    } else {
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
  }

  const map = new THREE.CanvasTexture(canvas);

  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(
    texture === "towel" ? 1.6 : texture === "loofah" ? 3 : 2,
    texture === "towel" ? 1.6 : texture === "loofah" ? 3 : 2,
  );
  map.generateMipmaps = texture !== "towel";
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  return map;
}

export function createTowelFiberHighlightTexture() {
  const size = 96;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  if (context) {
    drawTowelFiberHighlightTexture(context, size);
  }

  const map = new THREE.CanvasTexture(canvas);

  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.6, 1.6);
  map.generateMipmaps = false;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  return map;
}

export function createTowelCleanColorTexture() {
  const size = 96;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  if (context) {
    drawTowelCleanColorTexture(context, size);
  }

  const map = new THREE.CanvasTexture(canvas);

  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.6, 1.6);
  map.generateMipmaps = false;
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  return map;
}

export function getSurfaceBumpScale(texture: MeltSurfaceTexture) {
  if (texture === "towel") {
    return 0.13;
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
    return 150 + noise * 56;
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

function drawTowelSurfaceTexture(
  context: CanvasRenderingContext2D,
  size: number,
) {
  context.fillStyle = "rgb(150, 150, 150)";
  context.fillRect(0, 0, size, size);

  const imageData = context.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const value =
        132 +
        pseudoRandom(x, y) * 46 +
        Math.sin(x * 0.85 + y * 0.28) * 18 +
        Math.sin(x * -0.35 + y * 1.15) * 16;

      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.lineCap = "round";

  for (let i = 0; i < 900; i += 1) {
    const x = pseudoRandom(i, 7) * size;
    const y = pseudoRandom(i, 31) * size;
    const clusterX = Math.floor(x / 18);
    const clusterY = Math.floor(y / 18);
    const baseAngle =
      pseudoRandom(clusterX, clusterY) * Math.PI -
      Math.PI / 2 +
      Math.sin(clusterX * 1.2 + clusterY * 0.7) * 0.45;
    const angle = baseAngle + (pseudoRandom(i, 53) - 0.5) * 0.9;
    const length = 4 + pseudoRandom(i, 71) * 9;
    const width = 0.9 + pseudoRandom(i, 91) * 1.25;
    const shade = 62 + Math.floor(pseudoRandom(i, 113) * 178);
    const alpha = 0.46 + pseudoRandom(i, 137) * 0.42;
    const halfLength = length / 2;

    context.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(
      x - Math.cos(angle) * halfLength,
      y - Math.sin(angle) * halfLength,
    );
    context.lineTo(
      x + Math.cos(angle) * halfLength,
      y + Math.sin(angle) * halfLength,
    );
    context.stroke();
  }

  for (let i = 0; i < 260; i += 1) {
    const x = pseudoRandom(i, 173) * size;
    const y = pseudoRandom(i, 197) * size;
    const radius = 0.6 + pseudoRandom(i, 211) * 1.4;
    const shade = pseudoRandom(i, 223) > 0.5 ? 238 : 74;

    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.28)`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawTowelFiberHighlightTexture(
  context: CanvasRenderingContext2D,
  size: number,
) {
  context.fillStyle = "rgb(0, 0, 0)";
  context.fillRect(0, 0, size, size);
  context.lineCap = "round";

  for (let i = 0; i < 520; i += 1) {
    const x = pseudoRandom(i, 307) * size;
    const y = pseudoRandom(i, 331) * size;
    const clusterX = Math.floor(x / 18);
    const clusterY = Math.floor(y / 18);
    const baseAngle =
      pseudoRandom(clusterX, clusterY) * Math.PI -
      Math.PI / 2 +
      Math.sin(clusterX * 1.2 + clusterY * 0.7) * 0.45;
    const angle = baseAngle + (pseudoRandom(i, 353) - 0.5) * 0.9;
    const length = 4 + pseudoRandom(i, 371) * 8;
    const width = 0.7 + pseudoRandom(i, 389) * 0.9;
    const shade = 166 + Math.floor(pseudoRandom(i, 397) * 89);
    const alpha = 0.46 + pseudoRandom(i, 401) * 0.34;
    const halfLength = length / 2;

    context.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(
      x - Math.cos(angle) * halfLength,
      y - Math.sin(angle) * halfLength,
    );
    context.lineTo(
      x + Math.cos(angle) * halfLength,
      y + Math.sin(angle) * halfLength,
    );
    context.stroke();
  }
}

function drawTowelCleanColorTexture(
  context: CanvasRenderingContext2D,
  size: number,
) {
  context.fillStyle = "rgb(250, 250, 250)";
  context.fillRect(0, 0, size, size);
  context.lineCap = "round";

  for (let i = 0; i < 760; i += 1) {
    const x = pseudoRandom(i, 433) * size;
    const y = pseudoRandom(i, 457) * size;
    const clusterX = Math.floor(x / 18);
    const clusterY = Math.floor(y / 18);
    const baseAngle =
      pseudoRandom(clusterX, clusterY) * Math.PI -
      Math.PI / 2 +
      Math.sin(clusterX * 1.2 + clusterY * 0.7) * 0.45;
    const angle = baseAngle + (pseudoRandom(i, 479) - 0.5) * 0.9;
    const length = 4 + pseudoRandom(i, 491) * 9;
    const width = 0.75 + pseudoRandom(i, 503) * 1;
    const shade = 205 + Math.floor(pseudoRandom(i, 521) * 34);
    const alpha = 0.24 + pseudoRandom(i, 547) * 0.28;
    const halfLength = length / 2;

    context.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(
      x - Math.cos(angle) * halfLength,
      y - Math.sin(angle) * halfLength,
    );
    context.lineTo(
      x + Math.cos(angle) * halfLength,
      y + Math.sin(angle) * halfLength,
    );
    context.stroke();
  }

  for (let i = 0; i < 260; i += 1) {
    const x = pseudoRandom(i, 557) * size;
    const y = pseudoRandom(i, 571) * size;
    const radius = 0.5 + pseudoRandom(i, 587) * 1.2;

    context.fillStyle = "rgba(255, 255, 255, 0.34)";
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}
