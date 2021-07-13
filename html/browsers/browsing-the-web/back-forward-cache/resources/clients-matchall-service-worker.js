self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.url.match(/\/get-clients-matchall/)) {
    const options = { includeUncontrolled: true, type: 'all' };
    e.respondWith(
      self.clients.matchAll(options)
        .then(clients => {
          const client_urls = [];
          clients.forEach(client => client_urls.push(client.url));
          return new Response(JSON.stringify(client_urls));
        })
    );
  }
});
