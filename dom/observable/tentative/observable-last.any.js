promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next(1); // skipped
    subscriber.next(2);
    subscriber.complete();
  });

  const value = await source.last();

  assert_equals(
    value,
    2,
    "observable last should return a promise that resolves with the last value from the source observable"
  );
}, "observable last should return a promise that resolves with the last value from the source observable");

promise_test(async () => {
  const error = new Error("error from source");
  const source = new Observable((subscriber) => {
    subscriber.error(console.error());
  });

  let rejection;
  try {
    await source.last();
  } catch (e) {
    rejection = e;
  }

  assert_equals(
    rejection,
    error,
    "observable last should return a promise that rejects with the error from the source observable"
  );
}, "observable last should return a promise that rejects with the error from the source observable");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  let rejection;
  try {
    await source.last();
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof RangeError,
    "observable last should return a promise that rejects with a TypeError if the source observable completes without emitting any values"
  );

  assert_equals(
    rejection.message,
    "no values in sequence",
    "observable last should return a promise that rejects with a TypeError with message 'no values in sequence'"
  );
}, "observable last should return a promise that rejects if the source observable completes without emitting any values");

promise_test(async () => {
  const source = new Observable((subscriber) => {});

  const controller = new AbortController();
  const promise = source.last({ signal: controller.signal });

  controller.abort();

  let rejection;
  try {
    await promise;
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof DOMException,
    "observable last should return a promise that rejects with a DOMException if the signal is aborted"
  );

  assert_equals(
    rejection.name,
    "AbortError",
    "observable last should return a promise that rejects with a DOMException with name 'AbortError'"
  );

  assert_equals(
    rejection.message,
    "the subscription was aborted",
    "observable first should return a promise that rejects with a DOMException with message 'the subscription was aborted'"
  );
}, "observable last should take a signal that allows the consumer to abort the operation");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  const value = await source.last({ default: 1 });

  assert_equals(
    value,
    1,
    "observable last should take an option for a default value to return if the source observable completes without emitting any values"
  );
}, "observable last should take an option for a default value to return if the source observable completes without emitting any values");

promise_test(async () => {
  const logs = [];
  const source = new Observable((subscriber) => {
    logs.push("source subscribe");
    subscriber.addTeardown(() => {
      logs.push("source teardown");
    });
    subscriber.signal.addEventListener(
      "abort",
      () => {
        logs.push("source abort");
      },
      { once: true }
    );
    logs.push("before source next 1");
    subscriber.next(1);
    logs.push("after source next 1");
    logs.push("before source complete");
    subscriber.complete();
    logs.push("after source complete");
  });

  logs.push("calling last");
  const promise = source.last();

  assert_array_equals(
    logs,
    [
      "calling last",
      "source subscribe",
      "before source next 1",
      "after source next 1",
      "before source complete",
      "source teardown",
      "source abort",
      "after source complete",
    ],
    "observable last should have a proper lifecycle, synchronous check"
  );

  const lastValue = await promise;
  logs.push(`last resolved with: ${lastValue}`);

  assert_array_equals(
    logs,
    [
      "calling last",
      "source subscribe",
      "before source next 1",
      "after source next 1",
      "before source complete",
      "source teardown",
      "source abort",
      "after source complete",
      "last resolved with: 1",
    ],
    "observable last should have a proper lifecycle"
  );
}, "observable last should have a proper lifecycle");
