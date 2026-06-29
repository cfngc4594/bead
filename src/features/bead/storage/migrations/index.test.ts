import { describe, expect, test } from "bun:test";
import {
  isProjectV0,
  isProjectV1,
  isProjectV2,
  migrateProjectV0ToV1,
  migrateProjectV1ToV2,
  PROJECTS_STORAGE_KEYS,
  projectMigrations,
  runProjectMigrations,
} from ".";
import type { ProjectV0 } from "./v0/types";
import type { ProjectV1 } from "./v1/types";
import type { ProjectV2 } from "./v2/types";

describe("project storage migrations", () => {
  test("validates project v0 shape", () => {
    const project = createProjectV0();

    expect(isProjectV0(project)).toBe(true);
    expect(isProjectV0({ ...project, id: 1 })).toBe(false);
    expect(isProjectV0({ ...project, title: 1 })).toBe(false);
    expect(isProjectV0({ ...project, sizeId: 1 })).toBe(false);
    expect(isProjectV0({ ...project, rows: "16" })).toBe(false);
    expect(isProjectV0({ ...project, cols: "16" })).toBe(false);
    expect(isProjectV0({ ...project, snapshots: {} })).toBe(false);
    expect(isProjectV0({ ...project, extra: true })).toBe(false);
    expect(isProjectV0({ ...project, snapshots: [[{ index: 0 }]] })).toBe(
      false,
    );
    expect(
      isProjectV0({
        ...project,
        snapshots: [[{ index: 0, fill: { code: "A1" } }]],
      }),
    ).toBe(false);
    expect(isProjectV0({ ...project, currentIndex: "0" })).toBe(false);
    expect(isProjectV0({ ...project, updatedAt: "1" })).toBe(false);
  });

  test("validates project v1 shape", () => {
    const project = createProjectV1();

    expect(isProjectV1(project)).toBe(true);
    expect(isProjectV1({ ...project, id: 1 })).toBe(false);
    expect(isProjectV1({ ...project, title: 1 })).toBe(false);
    expect(isProjectV1({ ...project, sizeId: 1 })).toBe(false);
    expect(isProjectV1({ ...project, rows: "16" })).toBe(false);
    expect(isProjectV1({ ...project, cols: "16" })).toBe(false);
    expect(isProjectV1({ ...project, snapshots: {} })).toBe(false);
    expect(isProjectV1({ ...project, extra: true })).toBe(false);
    expect(isProjectV1({ ...project, snapshots: [[{ index: 0 }]] })).toBe(
      false,
    );
    expect(
      isProjectV1({
        ...project,
        snapshots: [[{ index: 0, fill: { code: "A1" } }]],
      }),
    ).toBe(false);
    expect(isProjectV1({ ...project, currentIndex: "0" })).toBe(false);
    expect(isProjectV1({ ...project, updatedAt: "1" })).toBe(false);
  });

  test("validates project v2 shape", () => {
    const project = createProjectV2();

    expect(isProjectV2(project)).toBe(true);
    expect(isProjectV2({ ...project, id: 1 })).toBe(false);
    expect(isProjectV2({ ...project, title: 1 })).toBe(false);
    expect(isProjectV2({ ...project, sizeId: 1 })).toBe(false);
    expect(isProjectV2({ ...project, rows: "16" })).toBe(false);
    expect(isProjectV2({ ...project, cols: "16" })).toBe(false);
    expect(isProjectV2({ ...project, snapshots: {} })).toBe(false);
    expect(isProjectV2({ ...project, extra: true })).toBe(false);
    expect(isProjectV2({ ...project, snapshots: [{}] })).toBe(false);
    expect(
      isProjectV2({
        ...project,
        snapshots: [{ ...project.snapshots[0], cells: [[0]] }],
      }),
    ).toBe(false);
    expect(
      isProjectV2({
        ...project,
        snapshots: [
          { ...project.snapshots[0], layers: [{ id: "layer-base" }] },
        ],
      }),
    ).toBe(false);
    expect(
      isProjectV2({
        ...project,
        snapshots: [{ ...project.snapshots[0], activeLayerId: 1 }],
      }),
    ).toBe(false);
    expect(isProjectV2({ ...project, currentIndex: "0" })).toBe(false);
    expect(isProjectV2({ ...project, updatedAt: "1" })).toBe(false);
  });

  test("keeps v0 and v1 structurally equivalent before snapshot v2 migration", () => {
    const project = createProjectV0();

    expect(isProjectV1(project)).toBe(true);
    expect(migrateProjectV0ToV1(project)).toEqual(project);
  });

  test("does not treat v2 projects as v0 or v1", () => {
    const project = createProjectV2();

    expect(isProjectV0(project)).toBe(false);
    expect(isProjectV1(project)).toBe(false);
  });

  test("exposes the expected storage migration chain", () => {
    expect(projectMigrations.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: PROJECTS_STORAGE_KEYS.v0, to: PROJECTS_STORAGE_KEYS.v1 },
      { from: PROJECTS_STORAGE_KEYS.v1, to: PROJECTS_STORAGE_KEYS.v2 },
    ]);
  });

  test("migrates v1 snapshots to v2 compact snapshots with a base layer", () => {
    const project = createProjectV1();

    const expectedProject = {
      ...project,
      snapshots: [
        {
          cells: [
            [0, "A1"],
            [4, "B2"],
          ],
          layers: [{ id: "layer-base", name: "图层 1" }],
          activeLayerId: "layer-base",
        },
      ],
    } satisfies ProjectV2;

    expect(migrateProjectV1ToV2(project)).toEqual(expectedProject);
  });

  test("runs chained migrations from v0 storage to v2 storage", () => {
    const storage = new MemoryStorage();
    const project = createProjectV0();
    const encodedKey = JSON.stringify(project.id);

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v0,
      JSON.stringify({
        [encodedKey]: {
          versionKey: project.id,
          data: project,
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(readCollection(storage, PROJECTS_STORAGE_KEYS.v1)).toEqual({
      [encodedKey]: {
        versionKey: project.id,
        data: project,
      },
    });
    expect(readCollection(storage, PROJECTS_STORAGE_KEYS.v2)).toEqual({
      [encodedKey]: {
        versionKey: project.id,
        data: migrateProjectV1ToV2(project),
      },
    });
  });

  test("does not overwrite projects that already exist in the target storage", () => {
    const storage = new MemoryStorage();
    const sourceProject = createProjectV1({ title: "source" });
    const targetProject = createProjectV2({ title: "target" });
    const encodedKey = JSON.stringify(sourceProject.id);

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v1,
      JSON.stringify({
        [encodedKey]: {
          versionKey: sourceProject.id,
          data: sourceProject,
        },
      }),
    );
    storage.setItem(
      PROJECTS_STORAGE_KEYS.v2,
      JSON.stringify({
        [encodedKey]: {
          versionKey: targetProject.id,
          data: targetProject,
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(readCollection(storage, PROJECTS_STORAGE_KEYS.v2)).toEqual({
      [encodedKey]: {
        versionKey: targetProject.id,
        data: targetProject,
      },
    });
  });

  test("skips invalid stored projects", () => {
    const storage = new MemoryStorage();

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v1,
      JSON.stringify({
        invalid: {
          versionKey: "invalid",
          data: {
            id: "invalid",
            snapshots: [[{ index: 0 }]],
          },
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(storage.getItem(PROJECTS_STORAGE_KEYS.v2)).toBeNull();
  });

  test("does not migrate data that does not match the source version", () => {
    const storage = new MemoryStorage();
    const project = createProjectV2();
    const encodedKey = JSON.stringify(project.id);

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v0,
      JSON.stringify({
        [encodedKey]: {
          versionKey: project.id,
          data: project,
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(storage.getItem(PROJECTS_STORAGE_KEYS.v1)).toBeNull();
    expect(storage.getItem(PROJECTS_STORAGE_KEYS.v2)).toBeNull();
  });

  test("ignores invalid stored collections", () => {
    const storage = new MemoryStorage();

    storage.setItem(PROJECTS_STORAGE_KEYS.v1, JSON.stringify([]));

    runProjectMigrations(projectMigrations, storage);

    expect(storage.getItem(PROJECTS_STORAGE_KEYS.v2)).toBeNull();
  });

  test("ignores stored collections with invalid item envelopes", () => {
    const storage = new MemoryStorage();
    const project = createProjectV1();
    const encodedKey = JSON.stringify(project.id);

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v1,
      JSON.stringify({
        [encodedKey]: {
          versionKey: project.id,
          data: project,
          extra: true,
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(storage.getItem(PROJECTS_STORAGE_KEYS.v2)).toBeNull();
  });

  test("preserves existing target projects while migrating new projects", () => {
    const storage = new MemoryStorage();
    const skippedProject = createProjectV1({ id: "skipped" });
    const migratedProject = createProjectV1({ id: "migrated" });
    const existingProject = createProjectV2({
      id: "skipped",
      title: "Already migrated",
    });
    const skippedKey = JSON.stringify(skippedProject.id);
    const migratedKey = JSON.stringify(migratedProject.id);

    storage.setItem(
      PROJECTS_STORAGE_KEYS.v1,
      JSON.stringify({
        [skippedKey]: {
          versionKey: skippedProject.id,
          data: skippedProject,
        },
        [migratedKey]: {
          versionKey: migratedProject.id,
          data: migratedProject,
        },
      }),
    );
    storage.setItem(
      PROJECTS_STORAGE_KEYS.v2,
      JSON.stringify({
        [skippedKey]: {
          versionKey: existingProject.id,
          data: existingProject,
        },
      }),
    );

    runProjectMigrations(projectMigrations, storage);

    expect(readCollection(storage, PROJECTS_STORAGE_KEYS.v2)).toEqual({
      [skippedKey]: {
        versionKey: existingProject.id,
        data: existingProject,
      },
      [migratedKey]: {
        versionKey: migratedProject.id,
        data: migrateProjectV1ToV2(migratedProject),
      },
    });
  });
});

function createProjectV0(overrides: Partial<ProjectV0> = {}): ProjectV0 {
  return {
    id: "project-1",
    title: "Project 1",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshots: [
      [
        { index: 0, fill: { code: "A1", hex: "#111111" } },
        { index: 4, fill: { code: "B2", hex: "#222222" } },
      ],
    ],
    currentIndex: 0,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function createProjectV1(overrides: Partial<ProjectV1> = {}): ProjectV1 {
  return createProjectV0(overrides);
}

function createProjectV2(overrides: Partial<ProjectV2> = {}): ProjectV2 {
  return {
    id: "project-1",
    title: "Project 1",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshots: [
      {
        cells: [
          [0, "A1"],
          [4, "B2", 1],
        ],
        layers: [
          {
            id: "layer-base",
            name: "图层 1",
            isHidden: true,
            isLocked: true,
          },
          {
            id: "layer-detail",
            name: "Detail layer",
            isHidden: true,
            isLocked: true,
          },
        ],
        activeLayerId: "layer-detail",
      },
    ],
    currentIndex: 0,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function readCollection(storage: Storage, key: string) {
  const value = storage.getItem(key);

  return value ? JSON.parse(value) : null;
}

class MemoryStorage implements Storage {
  readonly #items = new Map<string, string>();

  get length() {
    return this.#items.size;
  }

  clear() {
    this.#items.clear();
  }

  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.#items.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.#items.delete(key);
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value);
  }
}
