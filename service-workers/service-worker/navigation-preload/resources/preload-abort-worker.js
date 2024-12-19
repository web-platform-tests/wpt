skipWaiting();

addEventListener('activate', event => {
  event.waitUntil(self.registration.navigationPreload.enable());
});

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const channelName = url.searchParams.get('bc');
  const bc = new BroadcastChannel(channelName);

  const timeout = new Promise(resolve => {
    bc.addEventListener('message', function messageListener(event) {
      if (event.data != 'abort-expected') return;
      resolve('timeout');
      bc.removeEventListener('message', messageListener);
    });
  });

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
          return 'rejected-other-error';
        }
      }()),
      timeout
    ]).then(
      val => bc.postMessage(val),
      err => bc.postMessage(`Err: ${err.message}`)
    )
  );

  event.respondWith(event.preloadResponse);
});
