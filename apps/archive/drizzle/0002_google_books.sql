-- Books move from Open Library (numeric work ids) to Google Books (string
-- volume ids). The tables were empty, so they're recreated; the views read
-- every work id as text now.
DROP VIEW IF EXISTS "public"."all_logs";--> statement-breakpoint
DROP VIEW IF EXISTS "public"."all_backlog";--> statement-breakpoint
DROP TABLE "book_logs";--> statement-breakpoint
DROP TABLE "books";--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"poster" jsonb,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"authors" text[] DEFAULT '{}' NOT NULL,
	"publisher" text,
	"published_date" text,
	"pages" integer,
	"language" text,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"isbn13" text,
	"isbn10" text,
	"data" jsonb
);--> statement-breakpoint
CREATE TABLE "book_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" text NOT NULL,
	"status" text NOT NULL,
	"format" text,
	"reread" boolean DEFAULT false NOT NULL,
	"started_at" date,
	"finished_at" date,
	"rating" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_logs_rating" CHECK ("book_logs"."rating" between 1 and 10),
	CONSTRAINT "book_logs_status" CHECK ("book_logs"."status" in ('reading', 'finished', 'abandoned'))
);--> statement-breakpoint
ALTER TABLE "book_logs" ADD CONSTRAINT "book_logs_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_logs_book_idx" ON "book_logs" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "books_backlog_idx" ON "books" USING btree ("backlog_added_at");--> statement-breakpoint
CREATE VIEW "public"."all_backlog" AS (
  select 'movie' as type, id::text as work_id, title, year, backlog_added_at from movies where backlog_added_at is not null
  union all
  select 'show', id::text, title, year, backlog_added_at from shows where backlog_added_at is not null
  union all
  select 'game', id::text, title, year, backlog_added_at from games where backlog_added_at is not null
  union all
  select 'book', id, title, year, backlog_added_at from books where backlog_added_at is not null
  union all
  select 'record', release_id::text, title, year, backlog_added_at from records where backlog_added_at is not null
);--> statement-breakpoint
CREATE VIEW "public"."all_logs" AS (
  select l.id, 'movie' as type, l.movie_id::text as work_id, w.title, l.watched_at as log_date, l.rating, l.created_at
    from movie_logs l join movies w on w.id = l.movie_id
  union all
  select l.id, 'show', l.show_id::text, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from show_logs l join shows w on w.id = l.show_id
  union all
  select l.id, 'game', l.game_id::text, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from game_logs l join games w on w.id = l.game_id
  union all
  select l.id, 'book', l.book_id, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from book_logs l join books w on w.id = l.book_id
  union all
  select l.id, 'record', w.release_id::text, w.title, l.played_at, l.rating, l.created_at
    from record_logs l join records w on w.id = l.record_id
);
