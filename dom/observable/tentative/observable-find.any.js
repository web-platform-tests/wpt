promise_test(async () => {
  let inactiveAfterB = false;
  const source = new Observable((subscriber) => {
    subscriber.next("a");
    subscriber.next("b");
    inactiveAfterB = !subscriber.active;
    subscriber.next("c");
    subscriber.complete();
  });

  const value = await source.find((value) => value === "b");

  assert_equals(
    value,
    "b",
    "Promise resolves with the first value that passes the predicate"
  );

  assert_true(
    inactiveAfterB,
    "subscriber is inactive after the first value that passes the predicate"
  );
}, "find(): Promise resolves with the first value that passes the predicate");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next("a");
    subscriber.next("b");
    subscriber.next("c");
    subscriber.complete();
  });

  const value = await source.find(() => false);

  assert_equals(
    value,
    undefined,
    "Promise resolves with undefined if no value passes the predicate"
  );
}, "find(): Promise resolves with undefined if no value passes the predicate");

promise_test(async () => {
  const error = new Error("error from source");
  const source = new Observable((subscriber) => {
    subscriber.error(error);
  });

  let rejection;
  try {
    await source.find(() => true);
  } catch (e) {
    rejection = e;
  }

  assert_equals(
    rejection,
    error,
    "Promise rejects with the error emitted from the source Observable"
  );

  assert_equals(
    rejection.message,
    "error from source",
    "Promise rejects with the error emitted from the source Observable"
  );
}, "find(): Promise rejects with the error emitted from the source Observable");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next("ignored");
  });

  let rejection;
  try {
    await source.find(() => {
      throw new Error("thrown from predicate");
    });
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof Error,
    "Promise rejects with any error thrown from the predicate"
  );

  assert_equals(
    rejection.message,
    "thrown from predicate",
    "Promise rejects with any error thrown from the predicate"
  );
}, "find(): Promise rejects with any error thrown from the predicate");

promise_test(async () => {
  let indices = [];

  const source = new Observable((subscriber) => {
    subscriber.next("a");
    subscriber.next("b");
    subscriber.next("c");
    subscriber.complete();
  });

  const value = await source.find((value, index) => {
    indices.push(index);
    return false;
  });

  assert_equals(
    value,
    undefined,
    "Promise resolves with undefined if no value passes the predicate"
  );

  assert_array_equals(
    indices,
    [0, 1, 2],
    "find(): Passes the index of the value to the predicate"
  );
}, "find(): Passes the index of the value to the predicate");

promise_test(async () => {
  const controller = new AbortController();
  const source = new Observable((subscriber) => {
    subscriber.next("a");
    subscriber.next("b");
    subscriber.next("c");
    subscriber.complete();
  });

  const promise = source.find(() => true, { signal: controller.signal });

  controller.abort();

  let rejection;
  try {
    await promise;
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof DOMException,
    "Promise rejects with DOMException when the signal is aborted"
  );

  assert_equals(
    rejection.name,
    "AbortError",
    "Promise rejects with DOMException when the signal is aborted"
  );
}, "find(): Rejects with DOMException when the signal is aborted");
