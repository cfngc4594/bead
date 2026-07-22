CREATE TYPE "public"."canvas_size_id" AS ENUM('16x16', '29x29', '58x58', '87x87');--> statement-breakpoint
CREATE TABLE "discover_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"size_id" "canvas_size_id" NOT NULL,
	"snapshot" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discover_projects_title_not_empty" CHECK (char_length(btrim("discover_projects"."title")) > 0)
);
--> statement-breakpoint
CREATE INDEX "discover_projects_feed_idx" ON "discover_projects" USING btree ("published_at","id");