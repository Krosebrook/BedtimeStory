
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const CACHE_NAME = 'bedtime-chronicles-v5'; // Bump version for UI/Length updates
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/metadata.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
  'https://fonts.gstatic.com/s/i/short-term/release/googlestars/creativity/default/24px.svg',
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://esm.sh/@google/genai@^1.36.0',
  'https://esm.sh/framer-motion@11.18.2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip POST requests (Gemini API)
  if (event.request.method !== 'GET') return;

  // Handle navigation requests (SPA) - always serve index.html if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Caching Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          const isSuccessful = response.status === 200;
          const isCdn = url.hostname.includes('cdn.tailwindcss.com') || 
                        url.hostname.includes('fonts.gstatic.com') ||
                        url.hostname.includes('esm.sh');
          
          if (isSuccessful && (event.request.mode === 'no-cors' || isCdn || response.type === 'basic')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networked;
    })
  );
});
