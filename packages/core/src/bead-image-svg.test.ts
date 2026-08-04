import { expect, test } from "bun:test";
import { createBeadImageSvg } from "./bead-image-svg";

test("creates one complete export document with labels, bead codes, and stats", () => {
  const image = createBeadImageSvg({
    cols: 2,
    rows: 1,
    snapshot: {
      cells: [
        [0, "A1"],
        [1, "C7"],
      ],
    },
  });

  expect(image.width).toBe(92);
  expect(image.height).toBeGreaterThan(69);
  expect(image.svg).toContain(">A1</text>");
  expect(image.svg).toContain(">C7</text>");
  expect(image.svg).toContain(">A1 (1)</text>");
  expect(image.svg).toContain(">C7 (1)</text>");
  expect(image.svg.match(/>1<\/text>/g)).toHaveLength(4);
  expect(image.svg).toContain('fill="#FAF4C8"');
  expect(image.svg).toContain('fill="#3677D2"');
});

test("combines repeated colors in the export stats", () => {
  const image = createBeadImageSvg({
    cols: 2,
    rows: 1,
    snapshot: {
      cells: [
        [0, "C7"],
        [1, "C7"],
      ],
    },
  });

  expect(image.svg).toContain(">C7 (2)</text>");
  expect(image.svg).not.toContain(">C7 (1)</text>");
});

test("rejects invalid snapshot indexes", () => {
  expect(() =>
    createBeadImageSvg({
      cols: 1,
      rows: 1,
      snapshot: { cells: [[1, "A1"]] },
    }),
  ).toThrow("Canvas snapshot index is out of range: 1");
});

test("rejects duplicate snapshot indexes", () => {
  expect(() =>
    createBeadImageSvg({
      cols: 1,
      rows: 1,
      snapshot: {
        cells: [
          [0, "A1"],
          [0, "C7"],
        ],
      },
    }),
  ).toThrow("Canvas snapshot index is duplicated: 0");
});
