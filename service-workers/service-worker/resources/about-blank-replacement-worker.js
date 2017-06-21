// Helper routine to delay the nested frame load until we are done interacting
// with the initial about:blank client.
let resolveDelayed;
function delayedResponse() {
  return new Promise(resolve => {
    resolveDelayed = resolve;
  });
}

// Helper routine to find a client that matches a particular URL.  Note, we
// require that Client to be controlled to avoid false matches with other
// about:blank windows the browser might have.  The initial about:blank should
// inherit the controller from its parent.
async function getClientByURL(url) {
  let list = await clients.matchAll();
  for (client of list) {
    if (client.url === url) {
      return client;
    }
  }
}

// Helper routine to perform a ping-pong with the given target client.  We
// expect the Client to respond with its location URL.
async function pingPong(target) {
  function waitForPong() {
    return new Promise(resolve => {
      self.addEventListener('message', function onMessage(evt) {
        if (evt.data.type === 'PONG') {
          resolve(evt.data.location);
        }
      });
    });
  }

  target.postMessage({ type: 'PING' })
  return await waitForPong(target);
}

addEventListener('fetch', async evt => {
  let url = new URL(evt.request.url);
  if (!url.searchParams.get('nested')) {
    return;
  }

  // Delay the load of the nested frame so we can examine the Client
  // representing the window while it has the initial about:blank document.
  evt.respondWith(delayedResponse());

  // Find the initial about:blank document.
  let client = await getClientByURL('about:blank');
  if (!client) {
    resolveDelayed(new Response('failure: could not find about:blank client'));
    return;
  }

  // If the nested frame is configured to support a ping-pong, then
  // ping it now to verify its message listener exists.  We also
  // verify the Client's idea of its own location URL while we are doing
  // this.
  if (url.searchParams.get('ping')) {
    let loc = await pingPong(client);
    if (loc !== 'about:blank') {
      resolveDelayed(new Response(`failure: got location {$loc}, expected about:blank`));
      return;
    }
  }

  // Finally, allow the nested frame to complete loading.  We place the
  // Client ID we found for the initial about:blank in the body.
  resolveDelayed(new Response(client.id));
});

addEventListener('message', evt => {
  if (evt.data.type !== 'GET_CLIENT_ID') {
    return;
  }

  evt.waitUntil(async function() {
    let url = new URL(evt.data.url);

    // Find the given Client by its URL.
    let client = await getClientByURL(evt.data.url);
    if (!client) {
      evt.source.postMessage({
        type: 'GET_CLIENT_ID',
        result: `failure: could not find ${evt.data.url} client`
      });
      return;
    }

    // If the Client supports a ping-pong, then do it now to verify
    // the message listener exists and its location matches the
    // Client object.
    if (url.searchParams.get('ping')) {
      let loc = await pingPong(client);
      if (loc !== evt.data.url) {
        evt.source.postMessage({
          type: 'GET_CLIENT_ID',
          result: `failure: got location ${loc}, expected ${evt.data.url}`
        });
        return;
      }
    }

    // Finally, send the client ID back.
    evt.source.postMessage({
      type: 'GET_CLIENT_ID',
      result: client.id
    });
  }());
});
