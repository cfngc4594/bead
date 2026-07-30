import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { imageToCanvasSnapshot } from "./image-to-snapshot.js";

describe("imageToCanvasSnapshot", () => {
  test("removes near-white background connected to the image edge", async () => {
    const image = await createPng(3, 3, [
      "#fafafa",
      "#fafafa",
      "#fafafa",
      "#fafafa",
      "#000000",
      "#fafafa",
      "#fafafa",
      "#fafafa",
      "#fafafa",
    ]);

    await expect(imageToCanvasSnapshot(image, 3, 3)).resolves.toEqual({
      cells: [[4, "H7"]],
    });
  });

  test("keeps white subject cells enclosed by an outline", async () => {
    const image = await createPng(5, 5, [
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#000000",
      "#000000",
      "#000000",
      "#ffffff",
      "#ffffff",
      "#000000",
      "#ffffff",
      "#000000",
      "#ffffff",
      "#ffffff",
      "#000000",
      "#000000",
      "#000000",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
    ]);

    const snapshot = await imageToCanvasSnapshot(image, 5, 5);

    expect(snapshot.cells).toContainEqual([12, "T1"]);
    expect(snapshot.cells).toContainEqual([6, "H7"]);
    expect(snapshot.cells).toHaveLength(9);
  });

  test("maps foreground pixels to the nearest MARD color", async () => {
    const image = await createPng(3, 3, [
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#faf4c8",
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff",
    ]);

    await expect(imageToCanvasSnapshot(image, 3, 3)).resolves.toEqual({
      cells: [[4, "A1"]],
    });
  });

  test("limits the generated pattern to a practical palette", async () => {
    const colors = Array.from({ length: 64 }, (_, index) => {
      const value = (index * 47) % 240;
      return `#${value.toString(16).padStart(2, "0")}80${(239 - value)
        .toString(16)
        .padStart(2, "0")}`;
    });
    const image = await createPng(8, 8, colors);
    const snapshot = await imageToCanvasSnapshot(image, 8, 8);

    expect(
      new Set(snapshot.cells.map((cell) => cell[1])).size,
    ).toBeLessThanOrEqual(16);
  });
});

async function createPng(width: number, height: number, colors: string[]) {
  const pixels = Buffer.alloc(width * height * 3);

  colors.forEach((hex, index) => {
    pixels[index * 3] = Number.parseInt(hex.slice(1, 3), 16);
    pixels[index * 3 + 1] = Number.parseInt(hex.slice(3, 5), 16);
    pixels[index * 3 + 2] = Number.parseInt(hex.slice(5, 7), 16);
  });

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}
