CREATE TABLE "book_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" integer NOT NULL,
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
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"poster" jsonb,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"authors" text[] DEFAULT '{}' NOT NULL,
	"pages" integer,
	"subjects" text[] DEFAULT '{}' NOT NULL,
	"isbns" text[] DEFAULT '{}' NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_airport" text NOT NULL,
	"to_airport" text NOT NULL,
	"departure" timestamp NOT NULL,
	"arrival" timestamp,
	"flight_number" text,
	"airline" text,
	"aircraft" text,
	"registration" text,
	"seat" text,
	"cabin" text,
	"reservation" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" integer NOT NULL,
	"status" text NOT NULL,
	"platform" text,
	"hours_played" real,
	"started_at" date,
	"finished_at" date,
	"rating" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_logs_rating" CHECK ("game_logs"."rating" between 1 and 10),
	CONSTRAINT "game_logs_status" CHECK ("game_logs"."status" in ('playing', 'finished', 'completed', 'paused', 'abandoned'))
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"poster" jsonb,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"release_date" text,
	"developers" text[] DEFAULT '{}' NOT NULL,
	"publishers" text[] DEFAULT '{}' NOT NULL,
	"platforms" text[] DEFAULT '{}' NOT NULL,
	"steam_id" text,
	"external_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "movie_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" integer NOT NULL,
	"watched_at" date,
	"rewatch" boolean DEFAULT false NOT NULL,
	"rating" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movie_logs_rating" CHECK ("movie_logs"."rating" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"poster" jsonb,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"original_title" text,
	"release_date" text,
	"runtime" integer,
	"directors" text[] DEFAULT '{}' NOT NULL,
	"imdb_id" text,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "record_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"played_at" date,
	"rating" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "record_logs_rating" CHECK ("record_logs"."rating" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" integer NOT NULL,
	"master_id" integer,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"artists" text[] DEFAULT '{}' NOT NULL,
	"year" integer,
	"label" text,
	"catno" text,
	"format" text,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"styles" text[] DEFAULT '{}' NOT NULL,
	"barcodes" text[] DEFAULT '{}' NOT NULL,
	"cover" jsonb,
	"media_condition" text,
	"sleeve_condition" text,
	"variant" text,
	"acquired_at" date,
	"price_amount" numeric(12, 2),
	"price_currency" text,
	"store" text,
	"notes" text,
	"rating" smallint,
	"folder" text,
	"discogs_instance_id" integer,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"data" jsonb,
	CONSTRAINT "records_discogs_instance_id_unique" UNIQUE("discogs_instance_id"),
	CONSTRAINT "records_rating" CHECK ("records"."rating" between 1 and 10),
	CONSTRAINT "records_price" CHECK (("records"."price_amount" is null) = ("records"."price_currency" is null))
);
--> statement-breakpoint
CREATE TABLE "show_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" integer NOT NULL,
	"season_number" integer,
	"started_at" date,
	"finished_at" date,
	"rewatch" boolean DEFAULT false NOT NULL,
	"rating" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "show_logs_rating" CHECK ("show_logs"."rating" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"poster" jsonb,
	"backlog_added_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fetched_at" timestamp with time zone,
	"original_title" text,
	"first_air_date" text,
	"last_air_date" text,
	"status" text,
	"creators" text[] DEFAULT '{}' NOT NULL,
	"networks" text[] DEFAULT '{}' NOT NULL,
	"imdb_id" text,
	"data" jsonb,
	"seasons" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_logs" ADD CONSTRAINT "book_logs_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_logs" ADD CONSTRAINT "game_logs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_logs" ADD CONSTRAINT "movie_logs_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_logs" ADD CONSTRAINT "record_logs_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_logs" ADD CONSTRAINT "show_logs_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_logs_book_idx" ON "book_logs" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "books_backlog_idx" ON "books" USING btree ("backlog_added_at");--> statement-breakpoint
CREATE INDEX "flights_departure_idx" ON "flights" USING btree ("departure");--> statement-breakpoint
CREATE INDEX "game_logs_game_idx" ON "game_logs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "games_backlog_idx" ON "games" USING btree ("backlog_added_at");--> statement-breakpoint
CREATE INDEX "movie_logs_movie_idx" ON "movie_logs" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "movies_backlog_idx" ON "movies" USING btree ("backlog_added_at");--> statement-breakpoint
CREATE INDEX "record_logs_record_idx" ON "record_logs" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "records_release_idx" ON "records" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "show_logs_show_idx" ON "show_logs" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "shows_backlog_idx" ON "shows" USING btree ("backlog_added_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE VIEW "public"."all_backlog" AS (
  select 'movie' as type, id as work_id, title, year, backlog_added_at from movies where backlog_added_at is not null
  union all
  select 'show', id, title, year, backlog_added_at from shows where backlog_added_at is not null
  union all
  select 'game', id, title, year, backlog_added_at from games where backlog_added_at is not null
  union all
  select 'book', id, title, year, backlog_added_at from books where backlog_added_at is not null
  union all
  select 'record', release_id, title, year, backlog_added_at from records where backlog_added_at is not null
);--> statement-breakpoint
CREATE VIEW "public"."all_logs" AS (
  select l.id, 'movie' as type, l.movie_id as work_id, w.title, l.watched_at as log_date, l.rating, l.created_at
    from movie_logs l join movies w on w.id = l.movie_id
  union all
  select l.id, 'show', l.show_id, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from show_logs l join shows w on w.id = l.show_id
  union all
  select l.id, 'game', l.game_id, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from game_logs l join games w on w.id = l.game_id
  union all
  select l.id, 'book', l.book_id, w.title, coalesce(l.finished_at, l.started_at), l.rating, l.created_at
    from book_logs l join books w on w.id = l.book_id
  union all
  select l.id, 'record', w.release_id, w.title, l.played_at, l.rating, l.created_at
    from record_logs l join records w on w.id = l.record_id
);