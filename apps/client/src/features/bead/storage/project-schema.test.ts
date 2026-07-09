import { expect, test } from "bun:test";
import type { CanvasState } from "@/features/bead/lib/canvas-state";
import type { Project } from "./project-schema";
import { projectIntegritySchema, projectSchema } from "./project-schema";
import { compactCanvas, expandSnapshot } from "./project-snapshots";

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

test("projectIntegritySchema rejects invalid snapshot and cell references", () => {
  const project = createProject();
  const [snapshot] = project.snapshots;

  expect(
    projectIntegritySchema.safeParse(createProject({ currentIndex: 1 }))
      .success,
  ).toBe(false);
  expect(
    projectIntegritySchema.safeParse({
      ...project,
      snapshots: [{ ...snapshot, cells: [[256, "A1"]] }],
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
            [0, "B2"],
          ],
        },
      ],
    }).success,
  ).toBe(false);
});

test("compactCanvas round-trips a canvas snapshot", () => {
  const beads: CanvasState = [
    { code: "A1", hex: "#FAF4C8" },
    null,
    { code: "B2", hex: "#63F347" },
  ];

  const snapshot = compactCanvas(beads);

  expect(snapshot).toEqual({
    cells: [
      [0, "A1"],
      [2, "B2"],
    ],
  });
  expect(expandSnapshot({ cellCount: 3, snapshot })).toEqual(beads);
});

test("expandSnapshot rejects invalid snapshot references", () => {
  const project = createProject();
  const [snapshot] = project.snapshots;

  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, cells: [[256, "A1"]] },
    }),
  ).toThrow("Snapshot cell index is outside the canvas");
  expect(() =>
    expandSnapshot({
      cellCount: 256,
      snapshot: { ...snapshot, cells: [[0, "missing-color"]] },
    }),
  ).toThrow("Unknown bead color code");
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
          [0, "A1"],
          [5, "B2"],
        ],
      },
    ],
    currentIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}
