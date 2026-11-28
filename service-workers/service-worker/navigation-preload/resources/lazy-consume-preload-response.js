addEventListener('activate', event => {
  event.waitUntil(registration.navigationPreload.enable());
});

addEventListener('fetch', event => {
  event.respondWith(new Response('sw response'));

  if (event.request.mode == 'navigate') {
    event.waitUntil(async function() {
      try {
        const response = await event.preloadResponse;
        const text = await response.text();
        await broadcast(text);
      }
      catch (err) {
        await broadcast('threw');
      }
    }());
  }
});

async function broadcast(value) {
  const data = {
    testName: 'lazy-consume-preload-response',
    value
  };

  const cs = await clients.matchAll({includeUncontrolled: true});

  for (const client of cs) client.postMessage(data);
}