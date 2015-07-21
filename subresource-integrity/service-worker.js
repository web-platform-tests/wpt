var sriValue = 'sha256-dHLnd7yfqfwg9hOBYZf5jd8h73UcSNgZ0NqM26t7H7s=';

// Checks fetch API response for integrity property
self.addEventListener('fetch', function(event) {
  if (/service-worker-check.js$/.test(event.request.url)) {
    if ('request' in event && 'integrity' in event.request && event.request.integrity === sriValue) {
      event.respondWith(new Response('serviceWorkerResult = true;'));
    } else {
      event.respondWith(new Response('serviceWorkerResult = false;'));
    }
  }
});
