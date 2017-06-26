addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname == '/clients.matchAll') {
    event.respondWith(async function() {
      const clientsArray = await clients.matchAll();
      const body = clientsArray.map(c => ({
        id: c.id,
        reserved: c.reserved,
        url: c.url
      }));

      return new Response(JSON.stringify(body), {
        headers: {'Content-Type': 'application/json'}
      });
    }());

    return;
  }

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
  if (event.data.func == 'clients.matchAll') {
    event.waitUntil(async function() {
      const clients = await clients.matchAll(...(event.data.args || []))
      const r = clients.map(c => ({
        id: c.id,
        reserved: c.reserved,
        url: c.url
      }));

      await broadcast(event.test, r);
    }());
  }
});

async function broadcast(testName, value) {
  const data = { testName, value };
  const cs = await clients.matchAll({ includeUncontrolled: true });

  for (const client of cs) client.postMessage(data);
}

