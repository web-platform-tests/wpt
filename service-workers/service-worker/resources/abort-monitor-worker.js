skipWaiting();

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.searchParams.has('wait-for-abort')) {
    waitForAbort(event);
  }
  if (url.searchParams.has('abort-not-expected')) {
    abortNotExpected(event);
  }
});

function abortNotExpected(event) {
  const url = new URL(event.request.url);
  const channelName = url.searchParams.get('bc');
  const bc = new BroadcastChannel(channelName);
  const { request } = event;

  event.respondWith(
    new Response(JSON.stringify({ok: true}))
  );

  event.waitUntil(new Promise(resolve => {
    bc.onmessage = () => {
      bc.postMessage({ aborted: request.signal.aborted });
      resolve();
    };
  }));
}

function waitForAbort(event) {
  const url = new URL(event.request.url);
  const channelName = url.searchParams.get('bc');
  const bc = new BroadcastChannel(channelName);
  const { request } = event;

  event.waitUntil(
    (async function test() {
      if (!request.signal) {
        return 'no-signal';
      }

      if (request.signal.aborted) {
        return 'already-aborted';
      }

      return Promise.race([
        wait(2000).then(() => 'timeout'),
        new Promise(r => {
          request.signal.onabort = () => r('aborted');
        })
      ]);
    }()).then(
      val => bc.postMessage(val),
      err => bc.postMessage(`Err: ${err.message}`)
    )
  );
}
