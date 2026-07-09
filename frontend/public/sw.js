// NLDocs Service Worker
// 静态资源：缓存优先；API 调用：网络优先

const CACHE_VERSION = 'v2';
const CACHE_NAME = `nldocs-shell-${CACHE_VERSION}`;

// 应用 shell：安装时预缓存
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// 安装：预缓存应用 shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 激活：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 判断是否为同源 API 请求
const isApiRequest = (url) => url.pathname.startsWith('/api');

// 缓存优先策略：用于静态资源
const cacheFirst = (request) =>
  caches.match(request).then((cached) => {
    if (cached) {
      return cached;
    }
    return fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match('/index.html'));
  });

// 网络优先策略：用于 API 调用
const networkFirst = (request) =>
  fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      }
      return response;
    })
    .catch(() => caches.match(request));

// 请求分发：API 走网络优先，其余静态资源走缓存优先
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 仅处理同源 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
