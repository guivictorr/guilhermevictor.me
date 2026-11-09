# guilhermevictor.me

Monorepo for my personal apps, built around one shared design system.

```
apps/archive        Archive PWA: movies, shows, games, books, records and flights (TanStack Start + Postgres)
apps/site           guilhermevictor.me, my personal website (Next.js)
packages/ui         shadcn/ui on Base UI, the shared design system
packages/schemas    Zod schemas, the archive's data contract
docs/               archive documentation (start at docs/README.md)
```

## Setup

```bash
pnpm install
cp apps/archive/.env.example apps/archive/.env   # see docs/backend.md and docs/providers.md
cp apps/site/.env.example apps/site/.env.local   # Last.fm + Discogs
docker compose up -d                             # local Postgres for the archive
pnpm --filter archive db:migrate
```

## Scripts

```bash
pnpm dev          # archive on http://localhost:3000
pnpm dev:site     # website on http://localhost:3001
pnpm build        # build everything
pnpm typecheck    # all packages
pnpm lint
```

## Adding UI components

```bash
pnpm dlx shadcn@latest add <component> -c apps/archive
```

Components land in `packages/ui/src/components` and are imported from `@workspace/ui/components/*`.
