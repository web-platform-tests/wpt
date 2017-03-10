addEventListener('install', function(evt) {
  self.skipWaiting();
});

addEventListener('activate', function(evt) {
  evt.waitUntil(clients.claim());
});