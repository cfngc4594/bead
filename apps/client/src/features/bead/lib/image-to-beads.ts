import type { BeadColor } from "@/data/colors";
import {
  createPaletteEntries,
  findNearestPaletteColor,
  oklabDistance,
  type PaletteEntry,
  rgbToOklab,
  toBeadFill,
} from "@/features/bead/lib/color-match";
import {
  type SampledCell,
  type SampleMode,
  sampleCells,
} from "@/features/bead/lib/image-cell-sampling";
import {
  loadImageFile,
  renderImageToCanvas,
} from "@/features/bead/lib/image-raster";
import {
  cleanupSmallRegions,
  countTinyRegions,
} from "@/features/bead/lib/region-cleanup";
import type { BeadFill } from "@/features/bead/types";

type CandidateResult = {
  beads: (BeadFill | null)[];
  score: number;
};

export type ImageToBeadsOptions = {
  file: File;
  rows: number;
  cols: number;
  palette: readonly BeadColor[];
};

const transparentCellThreshold = 0.16;
const sampleModes: readonly SampleMode[] = ["average", "dominant"];

export async function generateBeadsFromImageFile({
  file,
  rows,
  cols,
  palette,
}: ImageToBeadsOptions): Promise<(BeadFill | null)[]> {
  const image = await loadImageFile(file);
  const imageData = renderImageToCanvas(image, rows / cols);
  const activePalette = createPaletteEntries(palette);

  if (activePalette.length === 0) {
    throw new Error("Palette is empty.");
  }

  const averageCells = sampleCells(imageData, rows, cols, "average");
  const candidates: CandidateResult[] = sampleModes.map((mode) => {
    const sampledCells =
      mode === "average"
        ? averageCells
        : sampleCells(imageData, rows, cols, mode);
    const beads = sampledCells.map((cell) =>
      cell.alphaShare < transparentCellThreshold
        ? null
        : toBeadFill(findNearestPaletteColor(cell.rgb, activePalette)),
    );
    const cleanedBeads = cleanupSmallRegions(beads, rows, cols, activePalette);

    return {
      beads: cleanedBeads,
      score: scoreCandidate(
        averageCells,
        cleanedBeads,
        rows,
        cols,
        activePalette,
      ),
    };
  });

  return candidates.sort((a, b) => a.score - b.score)[0].beads;
}

function scoreCandidate(
  baselineCells: readonly SampledCell[],
  beads: readonly (BeadFill | null)[],
  rows: number,
  cols: number,
  palette: readonly PaletteEntry[],
) {
  const paletteByCode = new Map(palette.map((color) => [color.code, color]));
  let colorError = 0;
  let activeCount = 0;

  for (let index = 0; index < beads.length; index += 1) {
    const bead = beads[index];

    if (!bead) {
      continue;
    }

    const paletteColor = paletteByCode.get(bead.code);

    if (!paletteColor) {
      continue;
    }

    colorError += oklabDistance(
      rgbToOklab(baselineCells[index].rgb),
      paletteColor.lab,
    );
    activeCount += 1;
  }

  const isolatedPenalty = countTinyRegions(beads, rows, cols, 1);
  return colorError / Math.max(1, activeCount) + isolatedPenalty * 1.2;
}
