-- Shows are logged and rated per season now; a show's rating is the average
-- of its seasons. Whole-show logs (season_number null) become logs of the
-- show's last season that has aired (TMDB lists announced ones too), from
-- the stored details; else its last listed season, else season 1.
-- Run `db:backfill-details --type=season` afterwards for those episodes.
UPDATE "show_logs" AS l
SET "season_number" = COALESCE(
  (
    SELECT max((s ->> 'seasonNumber')::int)
    FROM "shows" AS sh, jsonb_array_elements(sh."data" -> 'seasons') AS s
    WHERE sh."id" = l."show_id" AND (s ->> 'seasonNumber')::int > 0
      AND (s ->> 'airDate') IS NOT NULL
      AND (s ->> 'airDate')::date <= current_date
  ),
  (
    SELECT max((s ->> 'seasonNumber')::int)
    FROM "shows" AS sh, jsonb_array_elements(sh."data" -> 'seasons') AS s
    WHERE sh."id" = l."show_id" AND (s ->> 'seasonNumber')::int > 0
  ),
  1
),
  "updated_at" = now()
WHERE l."season_number" IS NULL;
