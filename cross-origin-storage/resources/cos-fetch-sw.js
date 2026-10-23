// Service worker used by fetch/fetch-service-worker.tentative*.https.html.
// On message, it runs fetch(url, init) and reports the outcome over the
// provided MessagePort, as {ok, status, text} or {ok: false, name}.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (e) => {
  const {port, url, init} = e.data;
  e.waitUntil((async () => {
    try {
      const response = await fetch(url, init);
      port.postMessage({ok: response.ok, status: response.status, text: await response.text()});
    } catch (err) {
      port.postMessage({ok: false, name: err.name});
    }
  })());
});
