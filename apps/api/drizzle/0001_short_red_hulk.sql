CREATE TABLE "discover_collection_items" (
	"collection_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "discover_collection_items_collection_id_project_id_pk" PRIMARY KEY("collection_id","project_id"),
	CONSTRAINT "discover_collection_items_position_nonnegative" CHECK ("discover_collection_items"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "discover_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discover_collections_title_not_empty" CHECK (char_length(btrim("discover_collections"."title")) > 0)
);
--> statement-breakpoint
ALTER TABLE "discover_collection_items" ADD CONSTRAINT "discover_collection_items_collection_id_discover_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."discover_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discover_collection_items" ADD CONSTRAINT "discover_collection_items_project_id_discover_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."discover_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discover_collection_items_position_idx" ON "discover_collection_items" USING btree ("collection_id","position");--> statement-breakpoint
CREATE INDEX "discover_collection_items_project_idx" ON "discover_collection_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "discover_collections_feed_idx" ON "discover_collections" USING btree ("published_at","id");