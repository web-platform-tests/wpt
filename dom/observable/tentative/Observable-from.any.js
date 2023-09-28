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
