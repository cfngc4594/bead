type StoredItem<T> = {
  versionKey: string;
  data: T;
};

type StoredCollection<T> = Record<string, StoredItem<T>>;

type ProjectMigration = {
  readonly from: string;
  readonly migrateProject: (project: unknown) => unknown | null;
  readonly to: string;
};

type TypedProjectMigration<FromProject, ToProject> = {
  readonly from: string;
  readonly isSourceProject: (project: unknown) => project is FromProject;
  readonly migrateProject: (project: FromProject) => ToProject;
  readonly to: string;
};

export function defineProjectMigration<FromProject, ToProject>({
  from,
  isSourceProject,
  migrateProject,
  to,
}: TypedProjectMigration<FromProject, ToProject>): ProjectMigration {
  return {
    from,
    migrateProject(project) {
      if (!isSourceProject(project)) {
        return null;
      }

      return migrateProject(project);
    },
    to,
  };
}

export { isProjectV0, isProjectV1 } from "./project-versions";
export { migrateProjectV0ToV1 } from "./v0-to-v1";
export { migrateProjectV1ToV2 } from "./v1-to-v2";

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

    if (!isStoredCollection<T>(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isStoredCollection<T>(value: unknown): value is StoredCollection<T> {
  if (!isRecord(value) || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (item) => isRecord(item) && "versionKey" in item && "data" in item,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
