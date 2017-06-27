addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (!url.searchParams.has('test')) return;

  event.respondWith(new Response('sw response', {
    headers: {'Content-Type': 'text/html'}
  }));

  event.waitUntil(
    broadcast(url.searchParams.get('test'), {
      clientId: event.clientId,
      reservedClientId: event.reservedClientId,
      targetClientId: event.targetClientId
    })
  );
});

addEventListener('message', event => {
  if (event.data.action == 'clients.matchAll') {
    event.waitUntil(async function() {
      const clientsArray = await clients.matchAll(...(event.data.args || []));
      const value = clientsArray.map(c => ({
        id: c.id,
        reserved: c.reserved,
        url: c.url
      }));

      event.source.postMessage({ id: event.data.id, value });
    }());
    return;
  }
  if (event.data.action == 'this-client-id') {
    event.source.postMessage({ id: event.data.id, value: event.source.id });
    return;
  }
});

async function broadcast(id, value) {
  const data = { id, value };
  const cs = await clients.matchAll({ includeUncontrolled: true });

  for (const client of cs) client.postMessage(data);
}

