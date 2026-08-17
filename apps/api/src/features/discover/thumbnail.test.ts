import { describe, expect, test } from "bun:test";
import { getMardColor, hexToRgb } from "@bead/core/colors";
import sharp from "sharp";
import {
  DISCOVER_THUMBNAIL_SCALE,
  renderDiscoverThumbnailPng,
} from "./thumbnail.js";

describe("renderDiscoverThumbnailPng", () => {
  test("renders filled beads and leaves empty cells transparent", async () => {
    const png = await renderDiscoverThumbnailPng({
      sizeId: "16x16",
      snapshot: { cells: [[0, "A1"]] },
    });
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const color = getMardColor("A1");
    if (!color) {
      throw new Error("expected A1 in the MARD catalog");
    }
    const bead = hexToRgb(color.hex);

    expect(info.width).toBe(16 * DISCOVER_THUMBNAIL_SCALE);
    expect(info.height).toBe(16 * DISCOVER_THUMBNAIL_SCALE);
    expect([...data.subarray(0, 4)]).toEqual([bead.r, bead.g, bead.b, 255]);
    const emptyOffset = DISCOVER_THUMBNAIL_SCALE * 4;
    expect(data[emptyOffset + 3]).toBe(0);
  });

  test("rejects unknown bead colors", async () => {
    await expect(
      renderDiscoverThumbnailPng({
        sizeId: "16x16",
        snapshot: { cells: [[0, "UNKNOWN"]] },
      }),
    ).rejects.toThrow("unknown color");
  });
});
