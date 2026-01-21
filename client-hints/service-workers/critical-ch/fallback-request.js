self.addEventListener('fetch', (event) => {
  console.error(event.request.url);
  // Just to avoid empty handler optimization.
  if(event.request.url === 'N/A') {
    event.respondWith(fetch(event.request));
  }
});
