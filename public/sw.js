const CACHE_NAME = 'cafe-pos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

// Cài đặt Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Kích hoạt và dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Chiến lược Fetch: Network First, falling back to cache
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các request GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Nếu thành công, có thể cập nhật cache ở đây nếu muốn
        return response;
      })
      .catch(() => {
        // Nếu offline hoặc lỗi mạng, mới tìm trong cache
        return caches.match(event.request);
      })
  );
});
