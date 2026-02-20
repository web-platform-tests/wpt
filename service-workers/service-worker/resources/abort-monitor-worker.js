skipWaiting();

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
      resolve();
      if (!request.signal) {
        bc.postMessage('no-signal');
        return;
      }
      bc.postMessage(`aborted-${request.signal.aborted}`);
    };
  }));
}

function waitForAbort(event) {
  const url = new URL(event.request.url);
  const channelName = url.searchParams.get('bc');
  const bc = new BroadcastChannel(channelName);
  const { request } = event;

  const timeout = new Promise(resolve => {
    bc.addEventListener('message', function messageListener(event) {
      if (event.data != 'abort-expected') return;
      resolve('timeout');
      bc.removeEventListener('message', messageListener);
    });
  });

  event.waitUntil(
    (async function test() {
      if (!request.signal) {
        return 'no-signal';
      }

      if (request.signal.aborted) {
        return 'already-aborted';
      }

      return Promise.race([
        timeout,
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
