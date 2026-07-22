import { canvasSizeDefinitions, canvasSizeIds } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
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
    rows: integer().notNull(),
    cols: integer().notNull(),
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
    check(
      "discover_projects_dimensions_match_size",
      sql.join(
        canvasSizeIds.map((sizeId) => {
          const { rows, cols } = canvasSizeDefinitions[sizeId];
          return sql`(${table.sizeId} = ${sql.raw(`'${sizeId}'`)} and ${table.rows} = ${sql.raw(String(rows))} and ${table.cols} = ${sql.raw(String(cols))})`;
        }),
        sql` or `,
      ),
    ),
  ],
);
