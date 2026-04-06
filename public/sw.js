const CACHE_NAME = 'inspire-planet-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/images/logo.png'];
const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1小时缓存有效期

// 缓存请求并添加时间戳
const cacheWithTimestamp = async (cache, request, response) => {
  const responseToCache = response.clone();
  const headers = new Headers(responseToCache.headers);
  headers.set('x-cache-timestamp', Date.now().toString());

  const cachedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers,
  });

  await cache.put(request, cachedResponse);
};

// 检查缓存是否过期
const isCacheExpired = (response) => {
  const timestamp = response.headers.get('x-cache-timestamp');
  if (!timestamp) return true;

  const cacheTime = parseInt(timestamp, 10);
  const now = Date.now();
  return now - cacheTime > CACHE_EXPIRY_TIME;
};

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
        // 检查缓存是否过期
        if (!isCacheExpired(response)) {
          return response;
        } else {
          console.log('Cache expired for:', request.url);
        }
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        caches.open(CACHE_NAME).then((cache) => {
          cacheWithTimestamp(cache, event.request, response);
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

// 监听消息，处理客户端的更新检查
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
