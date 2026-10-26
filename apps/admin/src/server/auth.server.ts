import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { getDb } from "./db/client.server"
import * as authSchema from "./db/auth-schema"
import { getAuthEnv } from "./env.server"

/*
 * Single-user auth: GitHub to get in the first time, then passkeys.
 * Only the GitHub account OWNER_GITHUB_ID may ever be linked, only
 * OWNER_EMAIL may create the user, and once it exists no one else can.
 */

const forbidden = () =>
  new APIError("FORBIDDEN", { message: "This archive is private." })

function createAuth() {
  const env = getAuthEnv()
  const owners = env.OWNER_EMAIL.split(",").map((e) => e.trim().toLowerCase())

  return betterAuth({
    appName: "Archive",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      // The PWA should stay signed in; sessions refresh daily while used.
      expiresIn: 60 * 60 * 24 * 90,
      updateAge: 60 * 60 * 24,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!owners.includes(user.email.toLowerCase())) throw forbidden()
            const existing = await getDb()
              .select({ id: authSchema.user.id })
              .from(authSchema.user)
              .limit(1)
            if (existing.length > 0) throw forbidden()
          },
        },
      },
      account: {
        create: {
          // Covers sign-up and implicit linking: an email match isn't enough.
          before: async (account) => {
            if (
              account.providerId === "github" &&
              account.accountId !== env.OWNER_GITHUB_ID
            )
              throw forbidden()
          },
        },
      },
    },
    plugins: [
      passkey({ rpName: "Archive" }),
      // Must stay last: writes Better Auth's cookies through Start.
      tanstackStartCookies(),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>

let instance: Auth | undefined

/** Lazy, so the app still builds and serves provider routes without auth env. */
export function getAuth(): Auth {
  instance ??= createAuth()
  return instance
}
