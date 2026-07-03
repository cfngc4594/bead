import { expect, test } from "bun:test";
import type { CanvasDocumentState } from "@/features/bead/lib/canvas-document";
import type { Project } from "./project-schema";
import { projectIntegritySchema, projectSchema } from "./project-schema";
import { compactDocument, expandSnapshot } from "./project-snapshots";

test("projectSchema accepts the current project shape", () => {
  expect(projectSchema.safeParse(createProject()).success).toBe(true);
});

test("projectSchema rejects invalid structure and dimensions", () => {
  expect(
    projectSchema.safeParse(createProject({ snapshots: [] })).success,
  ).toBe(false);
  expect(projectSchema.safeParse(createProject({ rows: 0 })).success).toBe(
    false,
  );
  expect(projectSchema.safeParse(createProject({ cols: 1.5 })).success).toBe(
    false,
  );
});

test("projectIntegritySchema accepts the current project shape", () => {
  expect(projectIntegritySchema.safeParse(createProject()).success).toBe(true);
});

test("projectIntegritySchema rejects invalid layer and cell references", () => {
  const project = createProject();
  const [snapshot] = project.snapshots;

  expect(
    projectIntegritySchema.safeParse(createProject({ currentIndex: 1 }))
      .success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [{ ...snapshot, activeLayerId: "missing-layer" }],
    }).success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [{ ...snapshot, cells: [[256, "A1", 0]] }],
    }).success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [{ ...snapshot, cells: [[0, "A1", 2]] }],
    }).success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [
        {
          ...snapshot,
          cells: [
            [0, "A1"],
            [0, "B2", 1],
          ],
        },
      ],
    }).success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [
        {
          ...snapshot,
          layers: [
            { id: "base", name: "Base" },
            { id: "base", name: "Duplicate" },
          ],
        },
      ],
    }).success,
  ).toBe(false);
});

test("compactDocument round-trips a layered canvas snapshot", () => {
  const document: CanvasDocumentState = {
    activeLayerId: "detail",
    beads: [
      { code: "A1", hex: "#FAF4C8" },
      null,
      { code: "B2", hex: "#63F347" },
    ],
    layers: [
      {
        id: "base",
        name: "Base",
        cellIndexes: [0],
        isHidden: false,
        isLocked: false,
      },
      {
        id: "detail",
        name: "Detail",
        cellIndexes: [2],
        isHidden: true,
        isLocked: true,
      },
    ],
  };

  const snapshot = compactDocument(document);

  expect(snapshot).toEqual({
    cells: [
      [0, "A1", 0],
      [2, "B2", 1],
    ],
    layers: [
      { id: "base", name: "Base" },
      { id: "detail", name: "Detail", isHidden: true, isLocked: true },
    ],
    activeLayerId: "detail",
  });
  expect(expandSnapshot({ cellCount: 3, snapshot })).toEqual(document);
});

test("expandSnapshot rejects invalid snapshot references instead of repairing them", () => {
  const project = createProject();
  const [snapshot] = project.snapshots;

  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, activeLayerId: "missing-layer" },
    }),
  ).toThrow("Snapshot active layer does not exist");
  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, cells: [[256, "A1", 0]] },
    }),
  ).toThrow("Snapshot cell index is outside the canvas");
  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, cells: [[0, "A1", 2]] },
    }),
  ).toThrow("Snapshot cell layer index does not exist");
  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, layers: [] },
    }),
  ).toThrow("Cannot expand a snapshot without layers");
  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, cells: [[0, "missing-color", 0]] },
    }),
  ).toThrow("Unknown bead color code");
});

test("compactDocument rejects inconsistent documents instead of repairing them", () => {
  const document: CanvasDocumentState = {
    activeLayerId: "base",
    beads: [{ code: "A1", hex: "#FAF4C8" }],
    layers: [
      {
        id: "base",
        name: "Base",
        cellIndexes: [0],
        isHidden: false,
        isLocked: false,
      },
    ],
  };

  expect(() => compactDocument({ ...document, layers: [] })).toThrow(
    "Cannot compact a document without layers",
  );
  expect(() =>
    compactDocument({
      ...document,
      layers: [{ ...document.layers[0], name: " " }],
    }),
  ).toThrow("Layer name must not be empty");
  expect(() =>
    compactDocument({
      ...document,
      layers: [{ ...document.layers[0], cellIndexes: [1] }],
    }),
  ).toThrow("Layer cell index is outside the canvas");
  expect(() =>
    compactDocument({
      ...document,
      layers: [{ ...document.layers[0], cellIndexes: [] }],
    }),
  ).toThrow("Filled cell is not assigned to a layer");
});

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    title: "Demo",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshots: [
      {
        cells: [
          [0, "A1", 0],
          [5, "B2", 1],
        ],
        layers: [
          { id: "base", name: "Base" },
          { id: "detail", name: "Detail", isLocked: true },
        ],
        activeLayerId: "detail",
      },
    ],
    currentIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}
