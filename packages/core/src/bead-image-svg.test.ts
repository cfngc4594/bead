import { expect, test } from "bun:test";
import {
  type BeadImageDisplayOptions,
  createBeadImageSvg,
  createBeadImageSvgRenderer,
  defaultBeadImageDisplayOptions,
} from "./bead-image-svg";

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

test("can hide the color legend", () => {
  const image = createBeadImageSvg({
    cols: 1,
    displayOptions: {
      ...defaultBeadImageDisplayOptions,
      showColorLegend: false,
    },
    rows: 1,
    snapshot: { cells: [[0, "A1"]] },
  });

  expect(image.svg).toContain(">A1</text>");
  expect(image.svg).not.toContain(">A1 (1)</text>");
});

test("can hide bead codes while retaining the color legend", () => {
  const image = createBeadImageSvg({
    cols: 1,
    displayOptions: {
      ...defaultBeadImageDisplayOptions,
      showBeadCodes: false,
    },
    rows: 1,
    snapshot: { cells: [[0, "A1"]] },
  });

  expect(image.svg).not.toContain(">A1</text>");
  expect(image.svg).toContain(">A1 (1)</text>");
});

test("always includes coordinates when auxiliary guides are hidden", () => {
  const image = createBeadImageSvg({
    cols: 12,
    displayOptions: {
      ...defaultBeadImageDisplayOptions,
      showGuides: false,
    },
    rows: 12,
    snapshot: { cells: [] },
  });

  expect(image.width).toBe(272);
  expect(image.svg).toContain(`fill="#f3f4f6"`);
  expect(image.svg.match(/>1<\/text>/g)).toHaveLength(4);
  expect(image.svg).not.toContain('data-guide-interval="5"');
  expect(image.svg).not.toContain('data-guide-interval="10"');
});

test("draws dashed five-cell guides and solid ten-cell guides", () => {
  const image = createBeadImageSvg({
    cols: 12,
    rows: 12,
    snapshot: { cells: [] },
  });

  expect(image.svg).toContain(
    '<line x1="108.5" y1="18.5" x2="108.5" y2="234.5" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>',
  );
  expect(image.svg).toContain(
    '<line x1="18.5" y1="108.5" x2="234.5" y2="108.5" stroke="#64748b" stroke-width="1" stroke-dasharray="4 3"/>',
  );
  expect(image.svg).toContain(
    '<line x1="198.5" y1="18.5" x2="198.5" y2="234.5" stroke="#334155" stroke-width="1.5"/>',
  );
  expect(image.svg).toContain(
    '<line x1="18.5" y1="198.5" x2="234.5" y2="198.5" stroke="#334155" stroke-width="1.5"/>',
  );
});

test("reuses rendered variants from one prepared image renderer", () => {
  const renderer = createBeadImageSvgRenderer({
    cols: 12,
    rows: 12,
    snapshot: { cells: [[0, "A1"]] },
  });
  const variants = Array.from({ length: 8 }, (_, cacheKey) => ({
    showBeadCodes: Boolean(cacheKey & 1),
    showColorLegend: Boolean(cacheKey & 2),
    showGuides: Boolean(cacheKey & 4),
  })) satisfies BeadImageDisplayOptions[];
  const images = variants.map((displayOptions) =>
    renderer.render(displayOptions),
  );

  expect(new Set(images.map((image) => image.svg))).toHaveLength(8);
  variants.forEach((displayOptions, index) => {
    expect(renderer.render({ ...displayOptions })).toBe(images[index]);
  });
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
