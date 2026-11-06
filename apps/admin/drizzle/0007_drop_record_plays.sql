DROP VIEW "public"."all_logs";--> statement-breakpoint
DROP TABLE "record_logs" CASCADE;--> statement-breakpoint
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
);