import { describe, expect, test } from "bun:test";
import { sampleCells } from "./image-cell-sampling";

describe("sampleCells", () => {
  const imageData = {
    data: new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 255, 255, 255, 0,
    ]),
    height: 2,
    width: 2,
  } as ImageData;

  test("averages opaque pixels and tracks transparency", () => {
    expect(sampleCells(imageData, 1, 1, "average")).toEqual([
      {
        alphaShare: 0.75,
        rgb: { r: 170, g: 0, b: 85 },
      },
    ]);
  });

  test("selects the dominant color bucket", () => {
    expect(sampleCells(imageData, 1, 1, "dominant")).toEqual([
      {
        alphaShare: 0.75,
        rgb: { r: 255, g: 0, b: 0 },
      },
    ]);
  });
});
