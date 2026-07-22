import { databaseEnv } from "@bead/api/database-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PostgresClient = ReturnType<typeof postgres>;

const databaseGlobal = globalThis as typeof globalThis & {
  beadPostgresClient?: PostgresClient;
};

const client =
  databaseGlobal.beadPostgresClient ??
  postgres(databaseEnv.DATABASE_URL, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 10,
  });

databaseGlobal.beadPostgresClient = client;

export const db = drizzle(client, { schema });
