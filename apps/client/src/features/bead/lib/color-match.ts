import type { BeadColor } from "@/data/colors";
import type { BeadFill } from "@/features/bead/types";

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type OklabColor = {
  l: number;
  a: number;
  b: number;
};

export type PaletteEntry = BeadColor & {
  rgb: RgbColor;
  lab: OklabColor;
};

export function createPaletteEntries(
  palette: readonly BeadColor[],
): PaletteEntry[] {
  return palette.map((color) => {
    const rgb = hexToRgb(color.hex);

    return {
      ...color,
      lab: rgbToOklab(rgb),
      rgb,
    };
  });
}

export function findNearestPaletteColor(
  targetRgb: RgbColor,
  palette: readonly PaletteEntry[],
) {
  const targetLab = rgbToOklab(targetRgb);
  let nearest = palette[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const color of palette) {
    const distance = oklabDistance(targetLab, color.lab);

    if (distance < nearestDistance) {
      nearest = color;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function toBeadFill(color: BeadColor): BeadFill {
  return {
    code: color.code,
    hex: color.hex,
  };
}

function hexToRgb(hex: string): RgbColor {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToOklab({ r, g, b }: RgbColor): OklabColor {
  const linearR = srgbToLinear(r / 255);
  const linearG = srgbToLinear(g / 255);
  const linearB = srgbToLinear(b / 255);

  const l =
    0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB;
  const m =
    0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB;
  const s =
    0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
}

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function oklabDistance(left: OklabColor, right: OklabColor) {
  const deltaL = left.l - right.l;
  const deltaA = left.a - right.a;
  const deltaB = left.b - right.b;

  return Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2) * 100;
}
