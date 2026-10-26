import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import tailwindcss from "@tailwindcss/vite"

// Origins the service worker fetches cover images from (public/sw.js).
const IMAGE_ORIGINS = [
  "https://image.tmdb.org",
  "https://images.igdb.com",
  "https://i.discogs.com",
  "https://books.google.com",
]

/*
 * The app is private: script/style 'unsafe-inline' is needed for Start's
 * hydration and next-themes scripts, but nothing may load from elsewhere
 * except images and the YouTube trailer embed.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${IMAGE_ORIGINS.join(" ")}`,
  "frame-src https://www.youtube-nocookie.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const SECURITY_HEADERS = {
  "X-Robots-Tag":
    "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  // "same-origin", not "no-referrer": the latter makes browsers send
  // `Origin: null` on same-origin POSTs, which fails the CSRF checks.
  "Referrer-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
}

export default defineConfig(({ mode }) => {
  // Expose non-VITE_ vars (API keys) to server functions via process.env.
  // They are never bundled into client code. Real env vars win over .env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""), process.env)

  return {
    resolve: {
      tsconfigPaths: true,
      alias: [
        // use-sync-external-store's CommonJS shims require("react") at
        // runtime, which crashes the Vercel function; use ESM stand-ins
        // that share the bundled React (src/lib/vendor).
        {
          find: /^use-sync-external-store\/shim\/with-selector(\.js)?$/,
          replacement: fileURLToPath(
            new URL(
              "./src/lib/vendor/use-sync-external-store-with-selector.ts",
              import.meta.url
            )
          ),
        },
        {
          find: /^use-sync-external-store\/shim(\/index(\.js)?)?$/,
          replacement: fileURLToPath(
            new URL(
              "./src/lib/vendor/use-sync-external-store-shim.ts",
              import.meta.url
            )
          ),
        },
      ],
    },
    // Listen on the LAN so the app can be tested on a real phone.
    server: { host: true },
    // Nitro picks the target at build time: Vercel when built there, a plain
    // Node server (`node .output/server/index.mjs`) anywhere else.
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart(),
      nitro({
        routeRules: {
          "/**": {
            headers: {
              ...SECURITY_HEADERS,
              // Vite's dev client injects scripts the CSP would block.
              ...(mode === "production"
                ? { "Content-Security-Policy": CSP }
                : {}),
            },
          },
        },
      }),
      viteReact(),
    ],
  }
})
