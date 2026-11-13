import { existsSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

// Same env files as the app; real env vars win (e.g. DATABASE_URL for Neon).
// .env.local first so it wins over .env, like Vite (loadEnvFile never
// overwrites a variable that's already set).
for (const file of [".env.local", ".env"])
  if (existsSync(file)) process.loadEnvFile(file)

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
})
