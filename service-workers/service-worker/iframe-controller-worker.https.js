addEventListener('install', function(e) {
  self.skipWaiting();
});

addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});