if (self.importScripts) {
  // Load scripts if being run from a worker
  importScripts(
    '/resources/testharness.js',
    '/common/utils.js'
  );
}

// This is used to close connections that weren't correctly closed during the tests,
// otherwise you can end up running out of HTTP connections.
let requestKeys = [];

function abortRequests() {
  const keys = requestKeys;
  requestKeys = [];
  return Promise.all(
    keys.map(key => fetch(`../resources/stash-put.py?key=${key}&value=close`))
  );
}

function assert_abort_error(err) {
  assert_equals(err.constructor, DOMException);
  assert_equals(err.name, 'AbortError');
}

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  await fetch('../resources/data.json', { signal }).then(() => {
    assert_unreached("Fetch must not resolve");
  }, err => {
    // Using .catch rather than try/catch to ensure the promise
    // is rejecting (rather than throwing).
    assert_abort_error(err);
  });
}, "Aborting rejects with AbortError");

test(() => {
  // TODO: we may want to discuss this design idea
  const request = new Request('');
  assert_true(Boolean(request.signal), "Signal member is present & truthy");
  assert_equals(request.signal.constructor, AbortSignal);
}, "Request objects have a signal property");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', { signal });

  // TODO: we may want to discuss this design idea
  assert_true(Boolean(request.signal), "Signal member is present & truthy");
  assert_equals(request.signal.constructor, AbortSignal);
  assert_not_equals(request.signal, signal, 'Request has a new signal, not a reference');

  await fetch(request).then(
    () => assert_unreached("Fetch must not resolve"),
    err => assert_abort_error(err)
  );
}, "Signal on request object");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', { signal });
  const requestFromRequest = new Request(request);

  await fetch(requestFromRequest).then(
    () => assert_unreached("Fetch must not resolve"),
    err => assert_abort_error(err)
  );
}, "Signal on request object created from request object");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json');
  const requestFromRequest = new Request(request, { signal });

  await fetch(requestFromRequest).then(
    () => assert_unreached("Fetch must not resolve"),
    err => assert_abort_error(err)
  );
}, "Signal on request object created from request object, with signal on second request");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', { signal: new AbortController().signal });
  const requestFromRequest = new Request(request, { signal });

  await fetch(requestFromRequest).then(
    () => assert_unreached("Fetch must not resolve"),
    err => assert_abort_error(err)
  );
}, "Signal on request object created from request object, with signal on second request overriding another");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', { signal });

  await fetch(request, {method: 'POST'}).then(
    () => assert_unreached("Fetch must not resolve"),
    err => assert_abort_error(err)
  );
}, "Signal retained after unrelated properties are overridden by fetch");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', { signal });

  const data = await fetch(request, { signal: null }).then(r => r.json());
  assert_equals(data.key, 'value', 'Fetch fully completes');
}, "Signal removed by setting to null");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const log = [];

  await Promise.all([
    fetch('../resources/data.json', { signal }).then(
      () => log.push('fetch-resolve'),
      () => log.push('fetch-reject')
    ),
    Promise.resolve().then(() => log.push('next-microtask'))
  ]);

  assert_array_equals(log, ['fetch-reject', 'next-microtask']);
}, "Already aborted signal rejects immediately");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const request = new Request('../resources/data.json', {
    signal,
    method: 'POST',
    body: 'foo',
    headers: { 'Content-Type': 'text/plain' }
  });

  await fetch(request).catch(() => {});

  assert_true(request.bodyUsed, "Body has been used");
}, "Request is still 'used' if signal is aborted before fetching");

const bodyMethods = ['arrayBuffer', 'blob', 'formData', 'json', 'text'];

for (const bodyMethod of bodyMethods) {
  promise_test(async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const log = [];
    const response = await fetch('../resources/data.json', { signal });
    
    controller.abort();
  
    await Promise.all([
      response[bodyMethod]().then(
        () => log.push(`${bodyMethod}-resolve`),
        err => {
          assert_abort_error(err);
          log.push(`${bodyMethod}-reject`);
        }
      ),
      Promise.resolve().then(() => log.push('next-microtask'))
    ]);
  
    assert_array_equals(log, [`${bodyMethod}-reject`, 'next-microtask']);
  }, `response.${bodyMethod}() rejects if already aborted`);
}

promise_test(async () => {
  await abortRequests();

  const controller = new AbortController();
  const signal = controller.signal;
  const stateKey = token();
  const abortKey = token();
  requestKeys.push(abortKey);
  controller.abort();

  await fetch(`../resources/infinite-slow-response.py?stateKey=${stateKey}&abortKey=${abortKey}`, { signal }).catch(() => {});
  
  // I'm hoping this will give the browser enough time to (incorrectly) make the request
  // above, if it intends to.
  await fetch('../resources/data.json').then(r => r.json());

  const response = await fetch(`../resources/stash-take.py?key=${stateKey}`);
  const data = await response.json();

  assert_equals(data, null, "Request hasn't been made to the server");
}, "Already aborted signal does not make request");

promise_test(async () => {
  await abortRequests();

  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const fetches = [];

  for (let i = 0; i < 3; i++) {
    const abortKey = token();
    requestKeys.push(abortKey);

    fetches.push(
      fetch(`../resources/infinite-slow-response.py?${i}&abortKey=${abortKey}`, { signal })
    );
  }

  for (const fetchPromise of fetches) {
    await fetchPromise.then(() => {
      assert_unreached("Fetch must not resolve");
    }, err => {
      assert_abort_error(err);
    });
  }
}, "Already aborted signal can be used for many fetches");

promise_test(async () => {
  await abortRequests();

  const controller = new AbortController();
  const signal = controller.signal;
  
  await fetch('../resources/data.json', { signal }).then(r => r.json());
  
  controller.abort();
  
  const fetches = [];
  
  for (let i = 0; i < 3; i++) {
    const abortKey = token();
    requestKeys.push(abortKey);

    fetches.push(
      fetch(`../resources/infinite-slow-response.py?${i}&abortKey=${abortKey}`, { signal })
    );
  }

  for (const fetchPromise of fetches) {
    await fetchPromise.then(() => {
      assert_unreached("Fetch must not resolve");
    }, err => {
      assert_abort_error(err);
    });
  }
}, "Signal can be used to abort other fetches, even if another fetch succeeded before aborting");

promise_test(async () => {
  await abortRequests();

  const controller = new AbortController();
  const signal = controller.signal;
  const stateKey = token();
  const abortKey = token();
  requestKeys.push(abortKey);
  
  await fetch(`../resources/infinite-slow-response.py?stateKey=${stateKey}&abortKey=${abortKey}`, { signal });

  const beforeAbortResult = await fetch(`../resources/stash-take.py?key=${stateKey}`).then(r => r.json());
  assert_equals(beforeAbortResult, "open", "Connection is open");

  controller.abort();

  // The connection won't close immediately, but it should close at some point:
  const start = Date.now();

  while (true) {
    // Stop spinning if 10 seconds have passed
    if (Date.now() - start > 10000) throw Error('Timed out');

    const afterAbortResult = await fetch(`../resources/stash-take.py?key=${stateKey}`).then(r => r.json());
    if (afterAbortResult == 'closed') break;
  }
}, "Underlying connection is closed when aborting after receiving response");

for (const bodyMethod of bodyMethods) {
  promise_test(async () => {
    await abortRequests();

    const controller = new AbortController();
    const signal = controller.signal;
    const stateKey = token();
    const abortKey = token();
    requestKeys.push(abortKey);

    const response = await fetch(`../resources/infinite-slow-response.py?stateKey=${stateKey}&abortKey=${abortKey}`, { signal });

    const beforeAbortResult = await fetch(`../resources/stash-take.py?key=${stateKey}`).then(r => r.json());
    assert_equals(beforeAbortResult, "open", "Connection is open");

    const bodyPromise = response[bodyMethod]();

    controller.abort();

    await bodyPromise.then(() => {
      assert_unreached("Body read must not resolve");
    }, err => {
      assert_abort_error(err);
    });

    const start = Date.now();

    while (true) {
      // Stop spinning if 10 seconds have passed
      if (Date.now() - start > 10000) throw Error('Timed out');

      const afterAbortResult = await fetch(`../resources/stash-take.py?key=${stateKey}`).then(r => r.json());
      if (afterAbortResult == 'closed') break;
    }
  }, `Fetch aborted & connection closed when aborted after calling response.${bodyMethod}()`);
}
