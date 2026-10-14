CREATE TYPE "public"."log_kind" AS ENUM('movie', 'show', 'season', 'game', 'book', 'record');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'show', 'game', 'book', 'record');--> statement-breakpoint
CREATE TABLE "backlog_items" (
	"type" "media_type" NOT NULL,
	"id" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"year" integer,
	"poster" jsonb,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "backlog_items_type_id_pk" PRIMARY KEY("type","id")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" integer NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"year" integer,
	"format" text,
	"label" text,
	"catno" text,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"styles" text[] DEFAULT '{}' NOT NULL,
	"cover" jsonb,
	"rating" smallint,
	"folder" text,
	"discogs_instance_id" integer,
	"media_condition" text,
	"sleeve_condition" text,
	"variant" text,
	"acquired_at" date,
	"price_amount" numeric(12, 2),
	"price_currency" text,
	"store" text,
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_discogs_instance_id_unique" UNIQUE("discogs_instance_id"),
	CONSTRAINT "collection_rating_range" CHECK ("collection_items"."rating" between 1 and 10),
	CONSTRAINT "collection_price_complete" CHECK (("collection_items"."price_amount" is null) = ("collection_items"."price_currency" is null))
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
CREATE TABLE "library_items" (
	"type" "media_type" NOT NULL,
	"id" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"year" integer,
	"poster" jsonb,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_items_type_id_pk" PRIMARY KEY("type","id")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "log_kind" NOT NULL,
	"media_type" "media_type" NOT NULL,
	"media_id" integer NOT NULL,
	"season_number" integer,
	"rating" smallint,
	"notes" text,
	"watched_at" date,
	"played_at" date,
	"started_at" date,
	"finished_at" date,
	"rewatch" boolean,
	"reread" boolean,
	"status" text,
	"platform" text,
	"hours_played" real,
	"format" text,
	"log_date" date GENERATED ALWAYS AS (coalesce(watched_at, played_at, finished_at, started_at)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logs_rating_range" CHECK ("logs"."rating" between 1 and 10),
	CONSTRAINT "logs_media_type_matches_kind" CHECK ("logs"."media_type"::text = case "logs"."kind" when 'season' then 'show' else "logs"."kind"::text end),
	CONSTRAINT "logs_season_number" CHECK (("logs"."kind" = 'season') = ("logs"."season_number" is not null))
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
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"config_id" text DEFAULT 'default' NOT NULL,
	"name" text,
	"start" text,
	"reference_id" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
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
ALTER TABLE "logs" ADD CONSTRAINT "logs_media_type_media_id_library_items_type_id_fk" FOREIGN KEY ("media_type","media_id") REFERENCES "public"."library_items"("type","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_release_idx" ON "collection_items" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "flights_departure_idx" ON "flights" USING btree ("departure");--> statement-breakpoint
CREATE INDEX "logs_media_idx" ON "logs" USING btree ("media_type","media_id");--> statement-breakpoint
CREATE INDEX "logs_date_idx" ON "logs" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "apikey_configId_idx" ON "apikey" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");