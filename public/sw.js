const CACHE_NAME = 'inspire-planet-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/images/logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 开发环境不缓存任何请求
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // 不缓存以下请求：
  // 1. chrome-extension等特殊协议
  // 2. 非GET请求
  // 3. 非http/https协议
  // 4. API请求
  if (
    !url.protocol.startsWith('http') ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/.netlify/functions') ||
    url.pathname.startsWith('/api')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
