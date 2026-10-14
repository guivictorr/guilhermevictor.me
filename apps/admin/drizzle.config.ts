import { existsSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

// Same .env as the app; real env vars win (e.g. DATABASE_URL for Neon).
if (existsSync(".env")) process.loadEnvFile(".env")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
})
