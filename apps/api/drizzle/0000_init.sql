CREATE TYPE "public"."canvas_size_id" AS ENUM('16x16', '29x29', '58x58', '87x87');--> statement-breakpoint
CREATE TABLE "discover_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"size_id" "canvas_size_id" NOT NULL,
	"rows" integer NOT NULL,
	"cols" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discover_projects_title_not_empty" CHECK (char_length(btrim("discover_projects"."title")) > 0),
	CONSTRAINT "discover_projects_dimensions_match_size" CHECK (("discover_projects"."size_id" = '16x16' and "discover_projects"."rows" = 16 and "discover_projects"."cols" = 16) or ("discover_projects"."size_id" = '29x29' and "discover_projects"."rows" = 29 and "discover_projects"."cols" = 29) or ("discover_projects"."size_id" = '58x58' and "discover_projects"."rows" = 58 and "discover_projects"."cols" = 58) or ("discover_projects"."size_id" = '87x87' and "discover_projects"."rows" = 87 and "discover_projects"."cols" = 87))
);
--> statement-breakpoint
CREATE INDEX "discover_projects_feed_idx" ON "discover_projects" USING btree ("published_at","id");