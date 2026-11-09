const CACHE_NAME = 'timer-plus-v2'; // 버전을 올리면 강제 업데이트 유도 가능
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 설치 시 멈춤 없이 즉시 새로운 서비스 워커 활성화
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 활성화 시 과거 버전의 구형 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크(깃허브) 최신 파일 먼저 요청 -> 실패 시(오프라인) 캐시(저장본) 사용
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크 통신 성공 시 최신 파일로 캐시 덮어쓰기
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // 인터넷이 끊겼을 때만 캐시 사용
  );
});
