import {
  findNearestPaletteColor,
  type PaletteEntry,
  type RgbColor,
  toBeadFill,
} from "@/features/bead/lib/color-match";
import type { BeadFill } from "@/features/bead/types";

const darkSnowMax = 0.34;
const highChannelBase = 176;
const highChannelRange = 79;
const lightSnowBase = 0.68;
const lightSnowRange = 0.24;
const lowChannelRange = 80;
const maxStaticAttempts = 8;
const midChannelBase = 64;
const midChannelRange = 160;
const rgbNoiseBase = 32;
const rgbNoiseRange = 208;
const scanlineDarkGain = 0.9;
const scanlineLightGain = 1.05;
const snowModeCutoff = 0.08;
const colorBurstModeCutoff = 0.26;

type TvStaticSampler = {
  seed: number;
};

type PickTvStaticBeadFillOptions = {
  beads: readonly (BeadFill | null)[];
  cols: number;
  index: number;
  palette: readonly PaletteEntry[];
  rows: number;
  sampler: TvStaticSampler;
};

export function createTvStaticSampler(): TvStaticSampler {
  return {
    seed: Math.floor(Math.random() * 0xffffffff),
  };
}

export function pickTvStaticBeadFill({
  beads,
  cols,
  index,
  palette,
  rows,
  sampler,
}: PickTvStaticBeadFillOptions) {
  if (palette.length === 0) {
    return null;
  }

  const neighbors = getNeighborCodes({ beads, cols, index, rows });
  const placeablePalette = palette.filter((color) =>
    canPlaceCandidate(color.code, neighbors),
  );
  const row = Math.floor(index / cols);
  let fallback = palette[0];

  for (let attempt = 0; attempt < maxStaticAttempts; attempt += 1) {
    const targetRgb = createTvStaticRgb({
      attempt,
      index,
      row,
      seed: sampler.seed,
    });
    const candidate = findNearestPaletteColor(targetRgb, palette);
    const constrainedCandidate = findNearestPlaceablePaletteColor({
      palette: placeablePalette,
      targetRgb,
    });

    if (canPlaceCandidate(candidate.code, neighbors)) {
      return toBeadFill(candidate);
    }

    fallback = constrainedCandidate ?? candidate;
  }

  return toBeadFill(fallback);
}

function findNearestPlaceablePaletteColor({
  palette,
  targetRgb,
}: {
  palette: readonly PaletteEntry[];
  targetRgb: RgbColor;
}) {
  if (palette.length === 0) {
    return null;
  }

  return findNearestPaletteColor(targetRgb, palette);
}

function createTvStaticRgb({
  attempt,
  index,
  row,
  seed,
}: {
  attempt: number;
  index: number;
  row: number;
  seed: number;
}): RgbColor {
  const random = createCellRandom(seed, index, attempt);
  const mode = random();
  const scanlineGain = row % 2 === 0 ? scanlineDarkGain : scanlineLightGain;

  if (mode < snowModeCutoff) {
    const snow =
      random() < 0.5
        ? random() * darkSnowMax
        : lightSnowBase + random() * lightSnowRange;
    const value = toByte(snow * scanlineGain);

    return {
      b: value,
      g: value,
      r: value,
    };
  }

  if (mode < colorBurstModeCutoff) {
    const hue = Math.floor(random() * 6);
    const low = random() * lowChannelRange;
    const high = highChannelBase + random() * highChannelRange;
    const mid = midChannelBase + random() * midChannelRange;
    const channels = [
      [high, mid, low],
      [mid, high, low],
      [low, high, mid],
      [low, mid, high],
      [mid, low, high],
      [high, low, mid],
    ][hue];

    return {
      b: toByte(channels[2] * scanlineGain),
      g: toByte(channels[1] * scanlineGain),
      r: toByte(channels[0] * scanlineGain),
    };
  }

  return {
    b: toByte((rgbNoiseBase + random() * rgbNoiseRange) * scanlineGain),
    g: toByte((rgbNoiseBase + random() * rgbNoiseRange) * scanlineGain),
    r: toByte((rgbNoiseBase + random() * rgbNoiseRange) * scanlineGain),
  };
}

function canPlaceCandidate(
  code: string,
  neighbors: readonly { code: string; isCardinal: boolean }[],
) {
  let sameNeighborCount = 0;

  for (const neighbor of neighbors) {
    if (code !== neighbor.code) {
      continue;
    }

    if (neighbor.isCardinal) {
      return false;
    }

    sameNeighborCount += 1;

    if (sameNeighborCount >= 2) {
      return false;
    }
  }

  return true;
}

function getNeighborCodes({
  beads,
  cols,
  index,
  rows,
}: {
  beads: readonly (BeadFill | null)[];
  cols: number;
  index: number;
  rows: number;
}) {
  const row = Math.floor(index / cols);
  const column = index % cols;
  const neighbors: { code: string; isCardinal: boolean }[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue;
      }

      const neighborRow = row + rowOffset;
      const neighborColumn = column + columnOffset;

      if (
        neighborRow < 0 ||
        neighborRow >= rows ||
        neighborColumn < 0 ||
        neighborColumn >= cols
      ) {
        continue;
      }

      const fill = beads[neighborRow * cols + neighborColumn];

      if (!fill) {
        continue;
      }

      neighbors.push({
        code: fill.code,
        isCardinal: Math.abs(rowOffset) + Math.abs(columnOffset) === 1,
      });
    }
  }

  return neighbors;
}

function createCellRandom(seed: number, index: number, attempt: number) {
  let state =
    (seed ^
      Math.imul(index + 1, 0x9e3779b1) ^
      Math.imul(attempt + 1, 0x85ebca6b)) >>>
    0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function toByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
