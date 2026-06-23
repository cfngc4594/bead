type StorageMigration = {
  from: string;
  to: string;
  migrate?: (value: string) => string;
};

export function runStorageMigrations(
  migrations: readonly StorageMigration[],
  storage = getBrowserStorage(),
) {
  if (!storage) {
    return;
  }

  for (const migration of migrations) {
    migrateStorageKey(migration, storage);
  }
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function migrateStorageKey(
  { from, migrate, to }: StorageMigration,
  storage: Storage,
) {
  if (storage.getItem(to)) {
    return;
  }

  const sourceValue = storage.getItem(from);

  if (!sourceValue) {
    return;
  }

  storage.setItem(to, migrate ? migrate(sourceValue) : sourceValue);
}
