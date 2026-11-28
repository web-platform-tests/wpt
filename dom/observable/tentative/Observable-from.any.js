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
