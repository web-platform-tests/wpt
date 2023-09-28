promise_test(async (t) => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  const completion = source.forEach((value) => {
    results.push(value);
  });

  assert_array_equals(
    results,
    [1, 2, 3],
    "value callback should be called synchronously for each value"
  );

  await completion;
});

promise_test(async (t) => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    throw error;
  });

  try {
    await source.forEach(() => {
      assert_unreached("should not be called");
    });
    assert_unreached("should not be reached");
  } catch (reason) {
    assert_equals(reason, error);
  }
}, "errors thrown by the initializer should be forwarded to the returned promise");

promise_test(async (t) => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.error(error);
  });

  try {
    await source.forEach(() => {
      assert_unreached("should not be called");
    });
    assert_unreached("should not be reached");
  } catch (reason) {
    assert_equals(reason, error);
  }
}, "errors pushed to the subscriber should be forwarded to the returned promise");

promise_test(async (t) => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  const completion = source.forEach((value) => {
    results.push(value);
    if (value === 2) {
      throw error;
    }
  });

  assert_array_equals(
    results,
    [1, 2],
    "value callback should be called synchronously for each value"
  );

  try {
    await completion;
    assert_unreached("should not be reached");
  } catch (reason) {
    assert_equals(reason, error);
  }
}, "errors thrown in the value callback should be forwarded to the returned promise");

promise_test(async (t) => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  const completion = source.forEach((value) => {
    results.push(value);
  });

  assert_array_equals(
    results,
    [1, 2, 3],
    "value callback should be called synchronously for each value"
  );

  const completionValue = await completion;
  assert_equals(
    completionValue,
    undefined,
    "returned promise does not resolve with a value"
  );
}, "returned promise does not resolve with a value");

promise_test(async (t) => {
  const addTeardownsCalled = [];
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      addTeardownsCalled.push("teardown 1");
    });

    subscriber.addTeardown(() => {
      addTeardownsCalled.push("teardown 2");
    });
  });

  const ac = new AbortController();

  const completion = source.forEach(() => {}, { signal: ac.signal });

  assert_array_equals(
    addTeardownsCalled,
    [],
    "addTeardown should not be called by forEach subscription alone"
  );

  ac.abort();

  assert_array_equals(
    addTeardownsCalled,
    ["teardown 2", "teardown 1"],
    "addTeardown callbacks should be called in LIFO order synchronously after the signal is aborted"
  );

  try {
    await completion;
    assert_unreached("should not be reached");
  } catch (reason) {
    assert_equals(reason.name, "AbortError");
  }
}, "Returned promise rejects with an AbortError if the signal is aborted");
