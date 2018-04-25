self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    if (url.endsWith('?ignore')) {
      return;
    }
    const match = url.match(/\?name=(\w*)/)
    if (!match) {
      event.respondWith(Promise.reject(TypeError('No name is provided.')));
      return;
    }

    event.respondWith(Promise.resolve().then(async () => {
        const name = match[1];
        await caches.delete('foo');
        const cache = await caches.open('foo');
        await cache.put(event.request, new Response('hello'));
        const keys = await cache.keys();

        console.log(keys);
        const original = event.request[name];
        const stored = keys[0][name];
        return new Response(`original: ${original}, stored: ${stored}`);
      }));
  });
