import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  // Expose non-VITE_ vars (API keys) to server functions via process.env.
  // They are never bundled into client code. Real env vars win over .env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""), process.env)

  return {
    resolve: { tsconfigPaths: true },
    // Listen on the LAN so the app can be tested on a real phone.
    server: { host: true },
    // Nitro picks the target at build time: Vercel when built there, a plain
    // Node server (`node .output/server/index.mjs`) anywhere else.
    plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
  }
})
