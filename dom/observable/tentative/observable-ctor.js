test(() => {
  assert_true(
    typeof Observable === "function",
    "Observable concstructor is defined"
  );
}, "Observable constructor");

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
    error: () => assert_unreached("should not be called"),
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
    next: () => assert_unreached("should not be called"),
    error: (e) => results.push(e),
    complete: () => assert_unreached("should not be called"),
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

  const source = new Observable((subscriber) => {
    try {
      subscriber.next(1);
      throw error;
    } finally {
      assert_true(subscriber.closed, "subscriber is closed after error");
    }
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (e) => results.push(e),
    complete: () => assert_unreached("should not be called"),
  });

  assert_array_equals(
    results,
    [1, error],
    "should emit values and the throw error synchronously"
  );
}, "Observable should error if initializer throws");

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
}, "subscribe can be called with no arguments");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
    assert_true(subscriber.closed, "subscriber is closed after complete");
  });

  source.subscribe();
}, "subscriber is closed after complete");

test(() => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.error(error);
    assert_true(subscriber.closed, "subscriber is closed after error");
  });

  source.subscribe();
}, "subscriber is closed after error");

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
    error: () => assert_unreached("should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, "complete"],
    "should emit values synchronously, but not nexted values after complete"
  );
}, "subscription does not emit values after completion");

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
    complete: () => assert_unreached("should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error],
    "should emit values synchronously, but not nexted values after error"
  );
}, "subscription does not emit values after error");

test(() => {
  const error = new Error("error");
  const results = [];

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
    assert_true(subscriber.closed, "subscriber is closed after error");
    subscriber.next();
    subscriber.complete();
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not be called"),
  });

  assert_array_equals(results, [1, 2, error], "should emit synchronously");
}, "completing or nexting a subscriber after an error does nothing");

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
    sibscriber.error(error);
  });

  // Not error handler provided.
  source.subscribe({
    next: () => assert_unreached("should not be called"),
    complete: () => assert_unreached("should not be called"),
  });

  assert_true(errorReported, "error should be reported");
}, "Errors pushed throw the subscriber that are not handled by the subscription are reported");

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
    throw error;
  });

  // Not error handler provided.
  source.subscribe({
    next: () => assert_unreached("should not be called"),
    complete: () => assert_unreached("should not be called"),
  });

  assert_true(errorReported, "error should be reported");
}, "Errors thrown in the initializer that are not handled by the subscription are reported");

test(() => {
  const error = new Error("error");
  const results = [];
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
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    subscriber.error(error);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, "complete"],
    "should emit values synchronously, but not error values after complete"
  );

  assert_true(errorReported, "error should be reported");
}, "subscription reports errors that are pushed after subscriber is closed by completion");

test(() => {
  const error = new Error("error");
  const results = [];
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
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    throw error;
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: () => assert_unreached("should not be called"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, "complete"],
    "should emit values synchronously, but not error after complete"
  );

  assert_true(errorReported, "error should be reported");
}, "Errors thrown by initializer function after subscriber is closed by completion are reported");

test(() => {
  const error1 = new Error("error 1");
  const error2 = new Error("error 2");
  const results = [];
  let errorReported = false;

  self.addEventListener(
    "error",
    (e) => {
      assert_equals(e.message, "Uncaught (in observable) error");
      assert_equals(e.filename, location.href);
      assert_greater_than(e.lineno, 0);
      assert_greater_than(e.colno, 0);
      assert_equals(e.error, error2);
      errorReported = true;
    },
    { once: true }
  );

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error1);
    throw error2;
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error1],
    "should emit values synchronously, but not nexted values after error"
  );

  assert_true(errorReported, "error should be reported");
}, "Errors thrown by initializer function after subscriber is closed by error are reported");

test(() => {
  const error1 = new Error("error 1");
  const error2 = new Error("error 2");
  const results = [];
  let errorReported = false;

  self.addEventListener(
    "error",
    (e) => {
      assert_equals(e.message, "Uncaught (in observable) error");
      assert_equals(e.filename, location.href);
      assert_greater_than(e.lineno, 0);
      assert_greater_than(e.colno, 0);
      assert_equals(e.error, error2);
      errorReported = true;
    },
    { once: true }
  );

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error1);
    subscriber.error(error2);
  });

  source.subscribe({
    next: (x) => results.push(x),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not be called"),
  });

  assert_array_equals(
    results,
    [1, 2, error1],
    "should emit values synchronously, but not nexted values after error"
  );

  assert_true(errorReported, "error should be reported");
}, "Errors pushed by initializer function after subscriber is closed by error are reported");

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
    error: () => assert_unreached("should not be called"),
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
    error: () => assert_unreached("should not be called"),
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
    complete: () => assert_unreached("should not be called"),
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
    complete: () => assert_unreached("should not be called"),
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

  assert_true(errorReported, "error should be reported");
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

  assert_true(errorReported, "error should be reported");
}, "calling subscribe should never throw an error synchronously, subscriber pushes error");
