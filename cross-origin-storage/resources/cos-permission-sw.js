// Service worker used by permissions-policy-workers.tentative.https.html.
// On message, it attempts a Cross-Origin Storage read and reports back the
// outcome (or the exception name) over the provided MessagePort. Per the
// spec, "check Cross-Origin Storage permission" returns false for a global
// with an empty owner set, which a ServiceWorkerGlobalScope has, so this is
// expected to reject with NotAllowedError.
// https://wicg.github.io/cross-origin-storage/#permissions-policy-integration

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', async (e) => {
  const {port, hash} = e.data;
  try {
    const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
    await handle.getFile();
    port.postMessage({ok: true});
  } catch (err) {
    port.postMessage({ok: false, name: err.name, message: err.message});
  }
});
