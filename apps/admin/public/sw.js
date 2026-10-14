/*
 * Hand-written service worker (vite-plugin-pwa can't generate one for
 * TanStack Start's multi-environment build). Online-first by design:
 *  - pages + server functions: network first, cached copy when offline
 *  - hashed build assets: cache first (immutable)
 *  - cover images (TMDB/IGDB/Discogs/Open Library): cache first, trimmed to a max entry count
 * Bump VERSION to drop old caches after changing this file.
 */
const VERSION = "v5"
const CACHES = {
  static: `static-${VERSION}`,
  pages: `pages-${VERSION}`,
  data: `data-${VERSION}`,
  images: `images-${VERSION}`,
}
const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg", "/pwa-192x192.png"]
const IMAGE_ORIGINS = [
  "https://image.tmdb.org",
  "https://images.igdb.com",
  "https://i.discogs.com",
  "https://books.google.com",
]
const MAX_IMAGES = 800
const NETWORK_TIMEOUT_MS = 4000

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHES.static)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  const current = new Set(Object.values(CACHES))
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !current.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHES.pages))
  } else if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_serverFn/")
  ) {
    event.respondWith(networkFirst(request, CACHES.data))
  } else if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/data/"))
  ) {
    event.respondWith(cacheFirst(request, CACHES.static))
  } else if (IMAGE_ORIGINS.includes(url.origin)) {
    event.respondWith(cacheFirst(request, CACHES.images, MAX_IMAGES))
  }
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached =
      (await cache.match(request)) ??
      (request.mode === "navigate" ? await caches.match("/") : undefined)
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  // Opaque (status 0) responses are fine for <img> cross-origin loads.
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone())
    if (maxEntries) trim(cache, maxEntries)
  }
  return response
}

async function trim(cache, maxEntries) {
  const keys = await cache.keys()
  // Cache keys are insertion-ordered: drop the oldest first.
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - maxEntries))
      .map((key) => cache.delete(key))
  )
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}
