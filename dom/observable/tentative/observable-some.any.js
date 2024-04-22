promise_test(async () => {
  let inactiveAfterFirstGood = true;

  const source = new Observable((subscriber) => {
    subscriber.next("good");
    inactiveAfterFirstGood = !subscriber.active;
    subscriber.next("good");
    subscriber.next("good");
    subscriber.complete();
  });

  const result = await source.some((value) => value === "good");

  assert_true(
    result,
    "Promise resolves with true if any value passes the predicate"
  );

  assert_true(
    inactiveAfterFirstGood,
    "subscriber is inactive after the first value that passes the predicate, because the source was unsubscribed from"
  );
}, "some(): subscriber is inactive after the first value that passes the predicate, because the source was unsubscribed from");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next("bad");
    subscriber.next("bad");
    subscriber.next("bad");
    subscriber.complete();
  });

  const result = await source.some((value) => value === "good");

  assert_false(
    result,
    "some(): Promise resolves with false if no value passes the predicate"
  );
});

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next("bad");
    subscriber.next("bad");
    subscriber.next("good");
    subscriber.complete();
  });

  const result = await source.some((value) => value === "good");

  assert_true(
    result,
    "some(): Promise resolves with true if any value passes the predicate"
  );
});

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.next("not used");
  });

  let rejection;
  try {
    await source.some(() => {
      throw new Error("thrown from predicate");
    });
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof Error,
    "The returned promise rejects with an error if the predicate errors"
  );

  assert_equals(
    rejection.message,
    "thrown from predicate",
    "The returned promise rejects with an error if the predicate errors"
  );
}, "some(): The returned promise rejects with an error if the predicate errors");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  let rejection;
  try {
    await source.some(() => true);
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof Error,
    "The returned promise rejects with an error if the source observable errors"
  );

  assert_equals(
    rejection.message,
    "error from source",
    "The returned promise rejects with an error if the source observable errors"
  );
}, "some(): The returned promise rejects with an error if the source observable errors");

promise_test(async () => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  const result = await source.some(() => true);

  assert_false(
    result,
    "The returned promise resolves as false if the source observable completes without emitting a value"
  );
}, "some(): The returned promise resolves as false if the source observable completes without emitting a value");

promise_test(async () => {
  let teardownCalled = false;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      teardownCalled = true;
    });
  });

  const controller = new AbortController();
  const promise = source.some(() => true, { signal: controller.signal });

  controller.abort();

  let rejection;
  try {
    await promise;
  } catch (e) {
    rejection = e;
  }

  assert_true(
    rejection instanceof DOMException,
    "The return promise rejects with a DOMException if the signal is aborted"
  );

  assert_equals(
    rejection.name,
    "AbortError",
    "The return promise rejects with a DOMException if the signal is aborted"
  );

  assert_true(
    teardownCalled,
    "The teardown function is called when the signal is aborted"
  );
}, "some(): The return promise rejects with a DOMException if the signal is aborted");
