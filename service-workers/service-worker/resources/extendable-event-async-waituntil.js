// controlled by 'init'/'done' messages.
var resolveLockPromise;
var port;

function makeHeavyPromise() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

self.addEventListener('message', function(event) {
    var waitPromise;
    var resolveTestPromise;

    switch (event.data.step) {
      case 'init':
        event.waitUntil(new Promise((res) => { resolveLockPromise = res; }));
        port = event.data.port;
        break;
      case 'done':
        resolveLockPromise();
        break;
      case 'no-current-extension-different-task':
        async_task_waituntil(event).then(reportResultExpecting('InvalidStateError'));
        break;
      case 'no-current-extension-different-microtask':
        async_microtask_waituntil(event).then(reportResultExpecting('OK'));
        break;
      case 'current-extension-different-task':
        event.waitUntil(new Promise((res) => { resolveTestPromise = res; }));
        async_task_waituntil(event).then(reportResultExpecting('OK')).then(resolveTestPromise);
        break;
      case 'current-extension-expired-same-microtask-turn':
        waitPromise = Promise.resolve();
        event.waitUntil(waitPromise);
        waitPromise.then(() => { return sync_waituntil(event); })
          .then(reportResultExpecting('OK'))
        break;
      case 'current-extension-expired-same-microtask-turn-extra':
        waitPromise = Promise.resolve();
        event.waitUntil(waitPromise);
        waitPromise.then(() => { return async_microtask_waituntil(event); })
          .then(reportResultExpecting('OK'))
        break;
      case 'heavy-current-extension-expired-same-microtask-turn':
        waitPromise = makeHeavyPromise();
        event.waitUntil(waitPromise);
        waitPromise.then(() => { return sync_waituntil(event); })
          .then(reportResultExpecting('OK'))
        break;
      case 'heavy-current-extension-expired-same-microtask-turn-extra':
        waitPromise = makeHeavyPromise();
        event.waitUntil(waitPromise);
        waitPromise.then(() => { return async_microtask_waituntil(event); })
          .then(reportResultExpecting('InvalidStateError'))
        break;
      case 'current-extension-expired-different-task':
        event.waitUntil(Promise.resolve());
        async_task_waituntil(event).then(reportResultExpecting('InvalidStateError'));
        break;
      case 'script-extendable-event':
        self.dispatchEvent(new ExtendableEvent('nontrustedevent'));
        break;
    }

    event.source.postMessage('ACK');
  });

self.addEventListener('fetch', function(event) {
  const path = new URL(event.request.url).pathname;
  const step = path.substring(path.lastIndexOf('/') + 1);
  let response;
  switch (step) {
    case 'pending-respondwith-async-waituntil':
      var resolveFetch;
      response = new Promise((res) => { resolveFetch = res; });
      event.respondWith(response);
      async_task_waituntil(event)
        .then(reportResultExpecting('OK'))
        .then(() => { resolveFetch(new Response('OK')); });
      break;
    case 'respondwith-microtask-sync-waituntil':
      response = Promise.resolve(new Response('RESP'));
      event.respondWith(response);
      response.then(() => { return sync_waituntil(event); })
        .then(reportResultExpecting('OK'));
      break;
    case 'respondwith-microtask-async-waituntil':
      response = Promise.resolve(new Response('RESP'));
      event.respondWith(response);
      response.then(() => { return async_microtask_waituntil(event); })
        .then(reportResultExpecting('OK'));
      break;
    case 'heavy-respondwith-microtask-sync-waituntil':
      response = makeHeavyPromise().then(() => {return new Response('RESP');});
      event.respondWith(response);
      response.then(() => { return sync_waituntil(event); })
        .then(reportResultExpecting('OK'));
      break;
    case 'heavy-respondwith-microtask-async-waituntil':
      response = makeHeavyPromise().then(() => {return new Response('RESP');});
      event.respondWith(response);
      response.then(() => { return async_microtask_waituntil(event); })
        .then(reportResultExpecting('InvalidStateError'))
      break;
  }
});

self.addEventListener('nontrustedevent', function(event) {
    sync_waituntil(event).then(reportResultExpecting('InvalidStateError'));
  });

function reportResultExpecting(expectedResult) {
  return function (result) {
    port.postMessage({result : result, expected: expectedResult});
    return result;
  };
}

function sync_waituntil(event) {
  return new Promise((res, rej) => {
    try {
      event.waitUntil(Promise.resolve());
      res('OK');
    } catch (error) {
      res(error.name);
    }
  });
}

function async_microtask_waituntil(event) {
  return new Promise((res, rej) => {
    Promise.resolve().then(() => {
      try {
        event.waitUntil(Promise.resolve());
        res('OK');
      } catch (error) {
        res(error.name);
      }
    });
  });
}

function async_task_waituntil(event) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      try {
        event.waitUntil(Promise.resolve());
        res('OK');
      } catch (error) {
        res(error.name);
      }
    }, 0);
  });
}
