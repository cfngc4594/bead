import { canvasSizeIds } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user as authUser } from "./auth-schema.js";

export const canvasSizeIdEnum = pgEnum("canvas_size_id", canvasSizeIds);

export const discoverProjects = pgTable(
  "discover_projects",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 80 }).notNull(),
    sizeId: canvasSizeIdEnum("size_id").notNull(),
    snapshot: jsonb().$type<CanvasSnapshot>().notNull(),
    publisherUserId: text("publisher_user_id").references(() => authUser.id),
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
