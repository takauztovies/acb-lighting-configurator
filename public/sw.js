// ACB Lighting Configurator Service Worker
// This is a minimal service worker to prevent 404 errors

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('ACB Service Worker: Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('ACB Service Worker: Activating...')
  event.waitUntil(self.clients.claim())
})

// Optional: Handle fetch events (currently no caching implemented)
self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
  // Could add caching logic here in the future if needed
})
