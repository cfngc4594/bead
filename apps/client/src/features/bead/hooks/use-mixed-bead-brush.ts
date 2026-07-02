import { useRef } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import { mardColors } from "@/data/colors";
import { createPaletteEntries } from "@/features/bead/lib/color-match";
import {
  createTvStaticSampler,
  pickTvStaticBeadFill,
} from "@/features/bead/lib/tv-static-brush";
import type { BeadFill } from "@/features/bead/types";

const mardPaletteEntries = createPaletteEntries(mardColors);

export function useMixedBeadBrush({
  beads,
  size,
}: {
  beads: readonly (BeadFill | null)[];
  size: CanvasSize;
}) {
  const strokeBeadsRef = useRef<(BeadFill | null)[] | null>(null);
  const strokeCellsRef = useRef(new Map<number, BeadFill | null>());
  const samplerRef = useRef<ReturnType<typeof createTvStaticSampler> | null>(
    null,
  );

  function beginStroke() {
    strokeBeadsRef.current = [...beads];
    strokeCellsRef.current.clear();
    samplerRef.current = createTvStaticSampler();
  }

  function pickFill(index: number) {
    if (strokeCellsRef.current.has(index)) {
      return strokeCellsRef.current.get(index) ?? null;
    }

    let sampler = samplerRef.current;

    if (!sampler) {
      sampler = createTvStaticSampler();
      samplerRef.current = sampler;
    }

    const fill = pickTvStaticBeadFill({
      beads: strokeBeadsRef.current ?? beads,
      cols: size.cols,
      index,
      palette: mardPaletteEntries,
      rows: size.rows,
      sampler,
    });

    strokeCellsRef.current.set(index, fill);
    return fill;
  }

  function commitCell(index: number, fill: BeadFill | null) {
    if (strokeBeadsRef.current) {
      strokeBeadsRef.current[index] = fill;
    }
  }

  function endStroke() {
    strokeBeadsRef.current = null;
    strokeCellsRef.current.clear();
    samplerRef.current = null;
  }

  return {
    beginStroke,
    commitCell,
    endStroke,
    pickFill,
  };
}
