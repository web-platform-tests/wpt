skipWaiting();

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

addEventListener('activate', event => {
  event.waitUntil(self.registration.navigationPreload.enable());
});

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const channelName = url.searchParams.get('bc');
  const bc = new BroadcastChannel(channelName);

  event.waitUntil(
    Promise.race([
      (async function test() {
        if (!event.preloadResponse) {
          return 'no-preload-response';
        }

        try {
          await event.preloadResponse;
          return 'resolved';
        }
        catch (err) {
          if (err.name == 'AbortError') {
            return 'rejected-aborterror';
          }
          return 'rejected-other-error'
        }
      }()),
      wait(2000).then(() => 'timeout')
    ]).then(
      val => bc.postMessage(val),
      err => bc.postMessage(`Err: ${err.message}`)
    )
  );

  event.respondWith(event.preloadResponse);
});
