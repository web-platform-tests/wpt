/*
// This is a really stupid set of hacks that I'm using to do some basic
// sanity-checking on the tests.
class AbortSignal {
  constructor() {
    this.aborted = false;
    this._abortCallbacks = [];
  }
  _abort() {
    this.aborted = true;
    for (const func of this._abortCallbacks) func();
    this._abortCallbacks = null;
  }
  _addAbortCallback(callback) {
    if (this.aborted) {
      callback();
      return;
    }
    this._abortCallbacks.push(callback);
  }
}

class AbortController {
  constructor() {
    this.signal = new AbortSignal();
  }
  abort() {
    this.signal._abort();
  }
}

function fetch(request, {
  signal = request.signal
}={}) {
  const url = request.url || request;

  if (signal && signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));

  return new Promise((resolve, reject) => {
    // Do the usual XHR stuff
    const req = new XMLHttpRequest();
    req.open('GET', url);

    const read = new Promise((readResolve, readReject) => {
      req.onload = () => {
        readResolve();
      };

      req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
          resolve({
            async json() {
              await read;
              return JSON.parse(req.responseText);
            },
            async text() {
              await read;
              return req.responseText;
            }
          })
        }
      };

      // Handle network errors
      req.onerror = () => {
        reject(Error("Network Error"));
        readReject(Error("Network Error"));
      };
  
      req.onabort = () => {
        reject(new DOMException('Aborted', 'AbortError'));
        readReject(new DOMException('Aborted', 'AbortError'));
      };
  
      // Make the request
      req.send();
  
      if (signal) {
        signal._addAbortCallback(() => req.abort());
      }
    });
  });
}
//*/

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

  assert_false(request.bodyUsed, "Body has not been used");
  assert_equals(await request.text(), 'foo', "Correct body");
}, "Request is not 'used' if signal is aborted before fetching");

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
  const controller = new AbortController();
  const signal = controller.signal;
  const key = token();
  controller.abort();

  await fetch(`../resources/infinite-slow-response.py?key=${key}`, { signal }).catch(() => {});
  
  // I'm hoping this will give the browser enough time to (incorrectly) make the request
  // above, if it intends to.
  await fetch('../resources/data.json').then(r => r.json());

  const response = await fetch(`../resources/stash-take.py?key=${key}`);
  const data = await response.json();

  assert_equals(data, null, "Request hasn't been made to the server");
}, "Already aborted signal does not make request");

promise_test(async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  controller.abort();

  const fetches = [];

  for (let i = 0; i < 3; i++) {
    fetches.push(
      fetch(`../resources/infinite-slow-response.py?${i}`, { signal })
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
  const controller = new AbortController();
  const signal = controller.signal;

  await fetch('../resources/data.json', { signal }).then(r => r.json());

  controller.abort();

  const fetches = [];

  for (let i = 0; i < 3; i++) {
    fetches.push(
      fetch(`../resources/infinite-slow-response.py?${i}`, { signal })
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
  const controller = new AbortController();
  const signal = controller.signal;
  const key = token();
  
  await fetch(`../resources/infinite-slow-response.py?key=${key}`, { signal });

  const beforeAbortResult = await fetch(`../resources/stash-take.py?key=${key}`).then(r => r.json());
  assert_equals(beforeAbortResult, "open", "Connection is open");

  controller.abort();

  // The connection won't close immediately, but it should close at some point:
  const start = Date.now();

  while (true) {
    // Stop spinning if 10 seconds have passed
    if (Date.now() - start > 10000) throw Error('Timed out');

    const afterAbortResult = await fetch(`../resources/stash-take.py?key=${key}`).then(r => r.json());
    if (afterAbortResult == 'closed') break;
  }
}, "Underlying connection is closed when aborting after receiving response");

for (const bodyMethod of bodyMethods) {
  promise_test(async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const key = token();

    const response = await fetch(`../resources/infinite-slow-response.py?key=${key}`, { signal });

    const beforeAbortResult = await fetch(`../resources/stash-take.py?key=${key}`).then(r => r.json());
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

      const afterAbortResult = await fetch(`../resources/stash-take.py?key=${key}`).then(r => r.json());
      if (afterAbortResult == 'closed') break;
    }
  }, `Fetch aborted & connection closed when aborted after calling response.${bodyMethod}()`);
}