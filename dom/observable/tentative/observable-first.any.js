promise_test(async () => {
  const source = new Observable((subscriber) => {
    let tornDown = false;
    subscriber.addTeardown(() => {
      tornDown = true;
    });
    subscriber.next(1);
    assert_true(
      subscriber.closed,
      "source subscriber should be closed after emitting the first value"
    );
    assert_true(
      tornDown,
      "source subscriber should be torn down after emitting the first value"
    );
    assert_true(
      subscriber.signal.aborted,
      "source subscriber's signal should be aborted after emitting the first value"
    );

    subscriber.next(2); // ignored
    subscriber.complete(); // ignored
  });

  const value = await source.first();

  assert_equals(
    value,
    1,
    "observable first should return a promise that resolves with the first value from the source observable"
  );
}, "observable first should return a promise that resolves with the first value from the source observable");

promise_test(async () => {
  const error = new Error("error from source");
  const source = new Observable((subscriber) => {
    subscriber.error(console.error());
  });

  let rejection;
  try {
    await source.first();
  } catch (e) {
    rejection = e;
  }

  assert_equals(
    rejection,
    error,
    "observable first should return a promise that rejects with the error from the source observable"
  );
}, "observable first should return a promise that rejects with the error from the source observable");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  let rejection;
  try {
    await source.first();
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof RangeError,
    "observable first should return a promise that rejects with a TypeError if the source observable completes without emitting any values"
  );

  assert_equals(
    rejection.message,
    "no values in sequence",
    "observable last should return a promise that rejects with a TypeError with message 'no values in sequence'"
  );
}, "observable first should return a promise that rejects if the source observable completes without emitting any values");

promise_test(async () => {
  const source = new Observable((subscriber) => {});

  const controller = new AbortController();
  const promise = source.first({ signal: controller.signal });

  controller.abort();

  let rejection;
  try {
    await promise;
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof DOMException,
    "observable first should return a promise that rejects with a DOMException if the signal is aborted"
  );

  assert_equals(
    rejection.name,
    "AbortError",
    "observable first should return a promise that rejects with a DOMException with name 'AbortError'"
  );

  assert_equals(
    rejection.message,
    "the subscription was aborted",
    "observable first should return a promise that rejects with a DOMException with message 'the subscription was aborted'"
  );
}, "observable first should take a signal that allows the consumer to abort the operation");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  const value = await source.first({ default: 1 });

  assert_equals(
    value,
    1,
    "observable first should take an option for a default value to return if the source observable completes without emitting any values"
  );
}, "observable first should take an option for a default value to return if the source observable completes without emitting any values");
