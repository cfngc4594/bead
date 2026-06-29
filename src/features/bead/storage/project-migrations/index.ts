import { z } from "zod";
import {
  isProjectV0,
  isProjectV1,
  isProjectV2,
  parseProjectV0,
  parseProjectV1,
} from "./project-versions";
import { migrateProjectV0ToV1 } from "./v0-to-v1";
import { migrateProjectV1ToV2 } from "./v1-to-v2";

type StoredItem<T> = {
  versionKey: string;
  data: T;
};

type StoredCollection<T> = Record<string, StoredItem<T>>;

const storedItemSchema = z
  .object({
    versionKey: z.string(),
    data: z.unknown(),
  })
  .strict();

const storedCollectionSchema = z.record(z.string(), storedItemSchema);

type ProjectMigration = {
  readonly from: string;
  readonly migrateProject: (project: unknown) => unknown | null;
  readonly to: string;
};

type TypedProjectMigration<FromProject, ToProject> = {
  readonly from: string;
  readonly migrateProject: (project: FromProject) => ToProject;
  readonly parseSourceProject: (project: unknown) => FromProject | null;
  readonly to: string;
};

export const PROJECTS_STORAGE_KEYS = {
  v0: "bead:v5:documents",
  v1: "bead:projects:v1",
  v2: "bead:projects:v2",
} as const;

export function defineProjectMigration<FromProject, ToProject>({
  from,
  migrateProject,
  parseSourceProject,
  to,
}: TypedProjectMigration<FromProject, ToProject>): ProjectMigration {
  return {
    from,
    migrateProject(project) {
      const sourceProject = parseSourceProject(project);

      if (!sourceProject) {
        return null;
      }

      return migrateProject(sourceProject);
    },
    to,
  };
}

export const projectMigrations = [
  defineProjectMigration({
    from: PROJECTS_STORAGE_KEYS.v0,
    migrateProject: migrateProjectV0ToV1,
    parseSourceProject: parseProjectV0,
    to: PROJECTS_STORAGE_KEYS.v1,
  }),
  defineProjectMigration({
    from: PROJECTS_STORAGE_KEYS.v1,
    migrateProject: migrateProjectV1ToV2,
    parseSourceProject: parseProjectV1,
    to: PROJECTS_STORAGE_KEYS.v2,
  }),
] as const;

export { isProjectV0, isProjectV1, isProjectV2 };
export { migrateProjectV0ToV1, migrateProjectV1ToV2 };

export function runProjectMigrations(
  migrations: readonly ProjectMigration[],
  storage = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  for (const migration of migrations) {
    migrateStoredProjects(migration, storage);
  }
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function migrateStoredProjects(
  { from, migrateProject, to }: ProjectMigration,
  storage: Storage,
) {
  const sourceCollection = readStoredCollection<unknown>(storage, from);

  if (!sourceCollection) {
    return;
  }

  const targetCollection =
    readStoredCollection<unknown>(storage, to) ??
    ({} as StoredCollection<unknown>);
  let hasChanges = false;

  for (const [encodedKey, storedProject] of Object.entries(sourceCollection)) {
    if (targetCollection[encodedKey]) {
      continue;
    }

    const migratedProject = migrateProject(storedProject.data);

    if (!migratedProject) {
      continue;
    }

    targetCollection[encodedKey] = {
      versionKey: storedProject.versionKey,
      data: migratedProject,
    };
    hasChanges = true;
  }

  if (hasChanges) {
    storage.setItem(to, JSON.stringify(targetCollection));
  }
}

function readStoredCollection<T>(storage: Storage, key: string) {
  const value = storage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const result = storedCollectionSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return result.data as StoredCollection<T>;
  } catch {
    return null;
  }
}
