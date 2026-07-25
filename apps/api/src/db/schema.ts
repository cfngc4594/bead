import { canvasSizeIds } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const canvasSizeIdEnum = pgEnum("canvas_size_id", canvasSizeIds);

export const discoverProjects = pgTable(
  "discover_projects",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 80 }).notNull(),
    sizeId: canvasSizeIdEnum("size_id").notNull(),
    snapshot: jsonb().$type<CanvasSnapshot>().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("discover_projects_feed_idx").on(table.publishedAt, table.id),
    check(
      "discover_projects_title_not_empty",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
  ],
);

export const discoverCollections = pgTable(
  "discover_collections",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 80 }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("discover_collections_feed_idx").on(table.publishedAt, table.id),
    check(
      "discover_collections_title_not_empty",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
  ],
);

export const discoverCollectionItems = pgTable(
  "discover_collection_items",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => discoverCollections.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => discoverProjects.id, { onDelete: "cascade" }),
    position: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.projectId] }),
    uniqueIndex("discover_collection_items_position_idx").on(
      table.collectionId,
      table.position,
    ),
    index("discover_collection_items_project_idx").on(table.projectId),
    check(
      "discover_collection_items_position_nonnegative",
      sql`${table.position} >= 0`,
    ),
  ],
);
