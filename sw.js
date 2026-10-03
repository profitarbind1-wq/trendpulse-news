/**
 * TrendPulse 360 - Modern Service Worker (v3.2.0)
 * Strategy: Network-First for Navigation & Dynamic Data.
 * Guarantees zero stale caching on normal F5 refresh.
 */

const CACHE_NAME = 'trendpulse-v3.2.0';
const OFFLINE_FALLBACK = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/cricket.js',
  '/js/poll.js',
  '/js/app.js',
  '/js/seo.js',
  '/manifest.json'
];

// Install: Cache offline assets and immediately take control
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_FALLBACK).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: Immediately purge all old cache versions (v1, v2, etc.) and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-First for everything when online to ensure F5 refresh is always 100% up-to-date
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Non-GET requests pass through directly
  if (req.method !== 'GET') return;

  // 1. Navigation (HTML pages) and Dynamic Data (cricket.json, news.json): ALWAYS NETWORK-FIRST
  if (req.mode === 'navigate' || url.includes('.html') || url.includes('data/') || url.includes('.json')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache only when offline
          return caches.match(req).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images): Network-First with Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(req);
      })
  );
});
