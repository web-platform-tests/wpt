// Because we test that the global error handler is called at various times.
setup({allow_uncaught_exception: true});

test(() => {
  assert_implements(self.Observable, "The Observable interface is not implemented");

  assert_true(
    typeof Observable === "function",
    "Observable constructor is defined"
  );

  assert_throws_js(TypeError, () => { new Observable(); });
}, "Observable constructor");

test(() => {
  assert_implements(self.Subscriber, "The Subscriber interface is not implemented");
  assert_true(
    typeof Subscriber === "function",
    "Subscriber interface is defined as a function"
  );

  assert_throws_js(TypeError, () => { new Subscriber(); });

  new Observable(subscriber => {
    assert_not_equals(subscriber, undefined, "A Subscriber must be passed into the subscribe callback");
    assert_implements(subscriber.next, "A Subscriber object must have a next() method");
    assert_implements(subscriber.complete, "A Subscriber object must have a complete() method");
    assert_implements(subscriber.error, "A Subscriber object must have an error() method");
  }).subscribe();
}, "Subscriber interface is not constructible");

test(() => {
  let initializerCalled = false;
  const source = new Observable(() => {
    initializerCalled = true;
  });

  assert_false(
    initializerCalled,
    "initializer should not be called by construction"
  );
  source.subscribe();
  assert_true(initializerCalled, "initializer should be called by subscribe");
}, "subscribe() can be called with no arguments");

test(() => {
  let initializerCalled = false;
  const results = [];

  const source = new Observable((subscriber) => {
    initializerCalled = true;
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  assert_false(
    initializerCalled,
    "initializer should not be called by construction"
  );

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("error should not be called"),
    complete: () => results.push("complete"),
  });

  assert_true(initializerCalled, "initializer should be called by subscribe");
  assert_array_equals(
    results,
    [1, 2, 3, "complete"],
    "should emit values synchronously"
  );
}, "Observable constructor calls initializer on subscribe");

test(() => {
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (e) => results.push(e),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error],
    "should emit error synchronously"
  );
}, "Observable error path called synchronously");

test(() => {
  const error = new Error("error");
  const results = [];
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, {once: true});

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    throw error;
    // TODO(https://github.com/WICG/observable/issues/76): If we add the
    // `subscriber.closed` attribute, consider a try-finally block to assert
    // that `subscriber.closed` is true after throwing. Also TODO: ensure that
    // that would even be the right behavior.
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (e) => results.push(e),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_equals(errorReported, null, "The global error handler should not be " +
      "invoked when the subscribe callback throws an error and the " +
      "subscriber has given an error handler");
  assert_array_equals(
    results,
    [1, error],
    "should emit values and the thrown error synchronously"
  );
}, "Observable should error if initializer throws");

// TODO(https://github.com/WICG/observable/issues/76): If we decide the
// `subscriber.closed` attribute is needed, re-visit these two tests that were
// originally included:
// https://github.com/web-platform-tests/wpt/blob/0246526ca46ef4e5eae8b8e4a87dd905c40f5326/dom/observable/tentative/observable-ctor.any.js#L123-L137.

// TODO(domfarolino): Add a test asserting that `Subscriber#signal` != the
// actual `AbortSignal` passed into `subscribe()`. See
// https://github.com/web-platform-tests/wpt/pull/42219#discussion_r1361243283.

test(() => {
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    subscriber.next(3);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("error should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, "complete"],
    "should emit values synchronously, but not nexted values after complete"
  );
}, "Subscription does not emit values after completion");

test(() => {
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
    subscriber.next(3);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (e) => results.push(e),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error],
    "should emit values synchronously, but not nexted values after error"
  );
}, "Subscription does not emit values after error");

test(() => {
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
    // TODO(https://github.com/WICG/observable/issues/76): Assert
    // `subscriber.closed` is true, if we add that attribute.
    // assert_true(subscriber.closed, "subscriber is closed after error");
    subscriber.next(3);
    subscriber.complete();
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(results, [1, 2, error], "should emit synchronously");
}, "Completing or nexting a subscriber after an error does nothing");

test(() => {
  const error = new Error("custom error");
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    subscriber.error(error);
  });

  // No error handler provided...
  source.subscribe({
    next: () => assert_unreached("next should not be called"),
    complete: () => assert_unreached("complete should not be called"),
  });

  // ... still the exception is reported to the global.
  assert_true(errorReported !== null, "Exception was reported to global");
  assert_equals(errorReported.message, "Uncaught Error: custom error", "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error, "Error object is equivalent");
}, "Errors pushed to the subscriber that are not handled by the subscription " +
   "are reported to the global");

test(() => {
  const error = new Error("custom error");
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    throw error;
  });

  // No error handler provided...
  source.subscribe({
    next: () => assert_unreached("next should not be called"),
    complete: () => assert_unreached("complete should not be called"),
  });

  // ... still the exception is reported to the global.
  assert_true(errorReported !== null, "Exception was reported to global");
  assert_equals(errorReported.message, "Uncaught Error: custom error", "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error, "Error object is equivalent");
}, "Errors thrown in the initializer that are not handled by the " +
   "subscription are reported to the global");

test(() => {
  const error = new Error("custom error");
  const results = [];
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    subscriber.error(error);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("error should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, "complete"],
    "should emit values synchronously, but not error values after complete"
  );

  // Error reporting still happens even after  the subscription is closed.
  assert_true(errorReported !== null, "Exception was reported to global");
  assert_equals(errorReported.message, "Uncaught Error: custom error", "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error, "Error object is equivalent");
}, "Subscription reports errors that are pushed after subscriber is closed " +
   "by completion");

test(t => {
  const error = new Error("custom error");
  const results = [];
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    throw error;
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("error should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(results, [1, 2, "complete"],
    "should emit values synchronously, but not error after complete"
  );

  assert_true(errorReported !== null, "Exception was reported to global");
  assert_true(errorReported.message.includes("custom error"), "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error, "Error object is equivalent");
}, "Errors thrown by initializer function after subscriber is closed by " +
   "completion are reported");

test(() => {
  const error1 = new Error("error 1");
  const error2 = new Error("error 2");
  const results = [];
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error1);
    throw error2;
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error1],
    "should emit values synchronously, but not nexted values after error"
  );

  assert_true(errorReported !== null, "Exception was reported to global");
  assert_true(errorReported.message.includes("error 2"), "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error2, "Error object is equivalent");
}, "Errors thrown by initializer function after subscriber is closed by " +
   "error are reported");

test(() => {
  const error1 = new Error("error 1");
  const error2 = new Error("error 2");
  const results = [];
  let errorReported = null;

  self.addEventListener("error", e => errorReported = e, { once: true });

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error1);
    subscriber.error(error2);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error1],
    "should emit values synchronously, but not nexted values after error"
  );

  assert_true(errorReported !== null, "Exception was reported to global");
  assert_true(errorReported.message.includes("error 2"), "Error message matches");
  assert_greater_than(errorReported.lineno, 0, "Error lineno is greater than 0");
  assert_greater_than(errorReported.colno, 0, "Error lineno is greater than 0");
  assert_equals(errorReported.error, error2, "Error object is equivalent");
}, "Errors pushed by initializer function after subscriber is closed by " +
   "error are reported");

test(() => {
  const source = new Observable((subscriber) => {
    let n = 0;
    while (!subscriber.closed) {
      subscriber.next(n++);
      if (n > 3) {
        assert_unreached("The subscriber should be closed by now");
      }
    }
  });

  const ac = new AbortController();
  const results = [];

  source.subscribe({
    next: (x) => {
      results.push(x);
      if (x === 2) {
        ac.abort();
      }
    },
    error: () => assert_unreached("error should not be called"),
    complete: () =>
      assert_unreached("should not complete because it was aborted"),
    signal: ac.signal,
  });

  assert_array_equals(results, [0, 1, 2], "should emit values synchronously");
}, "Aborting a subscription should close the subscriber and stop emitting values");

test(() => {
  let addTeardownCalled = false;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      assert_true(
        subscriber.closed,
        "subscriber is closed before teardown is called"
      );
      addTeardownCalled = true;
    });
  });

  const ac = new AbortController();
  source.subscribe({
    signal: ac.signal,
  });

  assert_false(
    addTeardownCalled,
    "addTeardown callback should not be called simply by subscribing"
  );
  ac.abort();
  assert_true(
    addTeardownCalled,
    "addTeardown callback should be called when subscription is aborted"
  );
}, "addTeardown callback should be called when subscription is aborted");

test(() => {
  const addTeardownsCalled = [];
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      assert_true(
        subscriber.closed,
        "subscriber is closed before teardown is called"
      );
      addTeardownsCalled.push("teardown 1");
    });

    subscriber.addTeardown(() => {
      addTeardownsCalled.push("teardown 2");
    });

    assert_array_equals(
      addTeardownsCalled,
      [],
      "addTeardown callbacks should not be called yet"
    );

    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();

    assert_array_equals(
      addTeardownsCalled,
      ["teardown 2", "teardown 1"],
      "addTeardown callbacks should be called in LIFO order"
    );
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("error should not be called"),
    complete: () => results.push("complete"),
  });

  assert_true(
    addTeardownCalled,
    "addTeardown callback should be called when subscription is closed by unsubscribe"
  );

  assert_array_equals(
    results,
    [1, 2, 3, "complete"],
    "should emit values and complete synchronously"
  );
}, "addTeardown callback should be called when subscription is closed by completion");

test(() => {
  const addTeardownsCalled = [];
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      assert_true(
        subscriber.closed,
        "subscriber is closed before teardown is called"
      );
      addTeardownsCalled.push("teardown 1");
    });

    subscriber.addTeardown(() => {
      addTeardownsCalled.push("teardown 2");
    });

    assert_array_equals(
      addTeardownsCalled,
      [],
      "addTeardown callbacks should not be called yet"
    );

    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.error(error);

    assert_array_equals(
      addTeardownsCalled,
      ["teardown 2", "teardown 1"],
      "addTeardown callbacks should be called in LIFO order"
    );
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    addTeardownsCalled,
    ["teardown 2", "teardown 1"],
    "addTeardown callbacks should be called in LIFO order"
  );

  assert_array_equals(
    results,
    [1, 2, 3, error],
    "should emit values and error synchronously"
  );
}, "addTeardown callback should be called when subscription is closed by subscriber pushing an error");

test(() => {
  let addTeardownsCalled = [];
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      assert_true(
        subscriber.closed,
        "subscriber is closed before teardown is called"
      );
      addTeardownsCalled.push("teardown 1");
    });

    subscriber.addTeardown(() => {
      addTeardownsCalled.push("teardown 2");
    });

    assert_array_equals(
      addTeardownsCalled,
      [],
      "addTeardown callbacks should not be called yet"
    );

    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    throw error;
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("complete should not be called"),
  });

  assert_array_equals(
    addTeardownsCalled,
    ["teardown 2", "teardown 1"],
    "addTeardown callbacks should be called in LIFO order"
  );

  assert_array_equals(
    results,
    [1, 2, 3, error],
    "should emit values and error synchronously"
  );
}, "addTeardown callbacks should be called in LIFO order when subscription is closed by initializer throwing an error");

test(() => {
  const error = new Error("error");
  let errorReported = false;

  self.addEventListener(
    "error",
    (e) => {
      assert_equals(e.message, "Uncaught (in observable) error");
      assert_equals(e.filename, location.href);
      assert_greater_than(e.lineno, 0);
      assert_greater_than(e.colno, 0);
      assert_equals(e.error, error);
      errorReported = true;
    },
    { once: true }
  );

  const source = new Observable(() => {
    throw error;
  });

  try {
    source.subscribe();
  } catch {
    assert_unreached("should never be reached");
  }

  assert_true(errorReported);
}, "calling subscribe should never throw an error synchronously, initializer throws error");

test(() => {
  const error = new Error("error");
  let errorReported = false;

  self.addEventListener(
    "error",
    (e) => {
      assert_equals(e.message, "Uncaught (in observable) error");
      assert_equals(e.filename, location.href);
      assert_greater_than(e.lineno, 0);
      assert_greater_than(e.colno, 0);
      assert_equals(e.error, error);
      errorReported = true;
    },
    { once: true }
  );

  const source = new Observable((subscriber) => {
    subscriber.error(error);
  });

  try {
    source.subscribe();
  } catch {
    assert_unreached("should never be reached");
  }

  assert_true(errorReported);
}, "calling subscribe should never throw an error synchronously, subscriber pushes error");
