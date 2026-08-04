import { expect, test } from "bun:test";
import { createPaletteEntries } from "@bead/core/colors";
import type { BeadFill } from "@/features/bead/types";
import { cleanupSmallRegions } from "./region-cleanup";

test("replaces a tiny region with a similar neighboring color", () => {
  const dark = { code: "DARK", hex: "#202020", type: "mard" } as const;
  const nearDark = { code: "NEAR", hex: "#242424", type: "mard" } as const;
  const palette = createPaletteEntries([dark, nearDark]);
  const beads: BeadFill[] = Array.from({ length: 9 }, () => ({
    code: dark.code,
    hex: dark.hex,
  }));
  beads[4] = { code: nearDark.code, hex: nearDark.hex };

  expect(cleanupSmallRegions(beads, 3, 3, palette)[4]).toEqual({
    code: dark.code,
    hex: dark.hex,
  });
});
