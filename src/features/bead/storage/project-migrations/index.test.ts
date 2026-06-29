import { describe, expect, test } from "bun:test";
import {
  isProjectV0,
  isProjectV1,
  migrateProjectV0ToV1,
  migrateProjectV1ToV2,
  PROJECTS_STORAGE_KEYS,
  projectMigrations,
  runProjectMigrations,
} from ".";
import type { ProjectV0, ProjectV1, ProjectV2 } from "./project-versions";

describe("project storage migrations", () => {
  test("validates versioned project shapes before migration", () => {
    const project = createProjectV0();

    expect(isProjectV0(project)).toBe(true);
    expect(isProjectV1(project)).toBe(true);
    expect(isProjectV0({ ...project, snapshots: [[{ index: 0 }]] })).toBe(
      false,
    );
    expect(isProjectV1({ ...project, snapshots: [[{ index: 0 }]] })).toBe(
      false,
    );
  });

  test("migrates v0 projects to v1 without changing data", () => {
    const project = createProjectV0();

    expect(migrateProjectV0ToV1(project)).toEqual(project);
  });

  test("migrates v1 snapshots to v2 compact snapshots with a base layer", () => {
    const project = createProjectV1();

    const expectedProject = {
      ...project,
      snapshots: [
        {
          v: 2,
          c: [
            [0, "A1"],
            [4, "B2"],
          ],
          l: [{ id: "layer-base", name: "图层 1" }],
          a: "layer-base",
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
        v: 2,
        c: [
          [0, "A1"],
          [4, "B2", 1],
        ],
        l: [
          { id: "layer-base", name: "图层 1", h: 1, k: 1 },
          { id: "layer-detail", name: "Detail layer", h: 1, k: 1 },
        ],
        a: "layer-detail",
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
