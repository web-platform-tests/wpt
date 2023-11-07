test(() => {
  assert_true(
    typeof Observable?.from === "function",
    "Observable.from should exist"
  );
}, "Observable.from should exist");

test(() => {
  const iterable = {
    [Symbol.iterator]() {
      let n = 0;
      return {
        next() {
          n++;
          if (n <= 3) {
            return { value: n, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };

  const observable = Observable.from(iterable);

  assert_true(observable instanceof Observable, "should return an Observable");

  const results = [];

  observable.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_array_equals(
    results,
    [1, 2, 3, "done"],
    "should convert an iterable to an Observable"
  );

  // A second subscription should restart iteration.

  observable.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done2"),
  });

  assert_array_equals(
    results,
    [1, 2, 3, "done", 1, 2, 3, "done2"],
    "should start iteration over again and emit the values"
  );
}, "should convert an iterable to an Observable");

promise_test(async () => {
  const promise = Promise.resolve("hi");

  const observable = Observable.from(promise);

  assert_true(observable instanceof Observable, "should return an Observable");

  const results = [];

  observable.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_array_equals(
    results,
    [],
    "should not emit until the promise resolves"
  );

  await promise;

  assert_array_equals(
    results,
    ["hi", "done"],
    "should convert a promise to an Observable"
  );
}, "should convert a promise to an Observable");

promise_test(async () => {
  const promise = Promise.reject("reason");

  const observable = Observable.from(promise);

  assert_true(observable instanceof Observable, "should return an Observable");

  const results = [];

  observable.subscribe({
    next: (value) => assert_unreached("should not emit"),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_array_equals(
    results,
    [],
    "should not emit until the promise resolves"
  );

  await promise.catch(() => {});

  assert_array_equals(
    results,
    ["reason"],
    "should convert a rejected promise to an Observable"
  );
}, "should convert a rejected promise to an Observable");

promise_test(async () => {
  const unhandledRejectionHandler = () => {
    assert_unreached("should not emit an unhandledrejection event");
  };

  self.addEventListener("unhandledrejection", unhandledRejectionHandler);

  try {
    const promise = Promise.reject("reason");

    const observable = Observable.from(promise);
    const results = [];

    observable.subscribe({
      error: (error) => results.push(error),
    });

    await promise.catch(() => {});

    assert_array_equals(
      results,
      [error],
      "should convert a rejected promise to an Observable"
    );
  } finally {
    self.removeEventListener("unhandledrejection", unhandledRejectionHandler);
  }
}, "should not report converted promise errors to unhandled promise rejections if it is handled in the subscription");

promise_test(async () => {
  const unhandledRejectionHandler = () => {
    assert_unreached("should not emit an unhandledrejection event");
  };

  self.addEventListener("unhandledrejection", unhandledRejectionHandler);

  let errorReported = false;

  self.addEventListener(
    "error",
    (e) => {
      assert_equals(e.message, "Uncaught (in observable) error");
      assert_equals(e.filename, location.href);
      assert_greater_than(e.lineno, 0);
      assert_greater_than(e.colno, 0);
      assert_equals(e.error, "reason");
      errorReported = true;
    },
    { once: true }
  );

  try {
    const promise = Promise.reject("reason");
    const observable = Observable.from(promise);
    const results = [];

    observable.subscribe({
      error: (error) => results.push(error),
    });

    await promise.catch(() => {});

    assert_array_equals(
      results,
      [error],
      "should convert a rejected promise to an Observable"
    );

    assert_true(
      errorReported,
      "should report the error to the global scope properly"
    );
  } finally {
    self.removeEventListener("unhandledrejection", unhandledRejectionHandler);
  }
}, "should not report converted promise errors to unhandled promise rejections if it is NOT handled in the subscription");

promise_test(async () => {
  let asyncIteratorsCreated = 0;
  let asyncIterableDone;

  const asyncIterable = {
    [Symbol.asyncIterator]() {
      let asyncIterator;

      asyncIterableDone = new Promise((resolve) => {
        let n = 0;
        asyncIteratorsCreated++;

        assert_equals(
          asyncIteratorsCreated,
          2,
          "should create only two async iterators in this test"
        );

        asyncIterator = {
          next() {
            n++;
            if (n <= 3) {
              return Promise.resolve({ value: n, done: false });
            }
            return Promise.resolve({ value: undefined, done: true }).finally(
              resolve
            );
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };
      });

      return asyncIterator;
    },
  };

  const observable = Observable.from(asyncIterable);

  assert_true(observable instanceof Observable, "should return an Observable");
  assert_equals(
    asyncIteratorsCreated,
    0,
    "should not create an async iterator until subscribed"
  );

  let results = [];

  observable.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_array_equals(
    results,
    [],
    "should not emit until the async iterable does"
  );

  await asyncIterableDone;

  assert_array_equals(
    results,
    [1, 2, 3, "done"],
    "should convert an async iterable to an Observable"
  );

  // The second time we subscribe it should start it all over again.
  results = [];

  observable.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_equals(asyncIteratorsCreated, 2, "should create a new async iterator");

  assert_array_equals(
    results,
    [],
    "should not emit until the async iterable does"
  );

  await asyncIterableDone;

  assert_array_equals(
    results,
    [1, 2, 3, "done"],
    "should convert an async iterable to an Observable"
  );
}, "should convert an async iterable to an Observable");

promise_test(async () => {
  let finalized = false;
  const generator = (async function* () {
    let n = 0;
    try {
      n++;
      while (n < 10) {
        yield n;
      }
    } finally {
      finalized = true;
    }
  })();

  const observable = Observable.from(generator);

  assert_true(observable instanceof Observable, "should return an Observable");

  const results = [];
  const ac = new AbortController();

  const abortHappened = new Promise((resolve) => {
    observable.subscribe({
      next: (value) => {
        results.push(value);
        if (value === 5) {
          // End the subscription after 5 values.
          ac.abort();
          resolve();
        }
      },
      error: () => assert_unreached("should not error"),
      complete: () =>
        assert_unreached(
          "should not complete, because we aborted the subscription"
        ),
      signal: ac.signal,
    });
  });

  await abortHappened;

  assert_array_equals(
    results,
    [1, 2, 3, 4, 5],
    "should convert an async generator to an Observable"
  );

  assert_true(finalized, "should finalize the async generator");
}, "should call return an on async generator when it is aborted");
