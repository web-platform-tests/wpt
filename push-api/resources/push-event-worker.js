self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function post(message) {
  const clients = await self.clients.matchAll({includeUncontrolled: true});
  for (const client of clients) {
    client.postMessage(message);
  }
}

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const message = {scope: self.registration.scope, push: true};
    message.hasData = event.data !== null;
    if (message.hasData) {
      message.text = event.data.text();
      message.bytes = Array.from(new Uint8Array(await event.data.arrayBuffer()));
    }
    await post(message);
  })());
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(post({
    scope: self.registration.scope,
    push: false,
    oldSubscription: event.oldSubscription ? event.oldSubscription.endpoint : null,
    newSubscription: event.newSubscription ? event.newSubscription.endpoint : null,
  }));
});
