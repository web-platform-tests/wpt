test(() => {
  const results = [];
  const indices = [];
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const mapped = source.map((value, i) => {
    indices.push(i);
    return value * 2;
  });

  assert_true(mapped instanceof Observable, "should return an Observable");

  assert_array_equals(results, [], "should not map until subscribed");
  assert_array_equals(indices, [], "should not map until subscribed");

  mapped.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_array_equals(results, [2, 4, 6, "done"], "should map values");
  assert_array_equals(
    indices,
    [0, 1, 2],
    "should provide indices to the projection function"
  );
}, "should map values");

test(() => {
  const error = new Error("error");
  const results = [];
  let addTeardownCalled = false;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      addTeardownCalled = true;
    });
    subscriber.next(1);
    assert_false(
      addTeardownCalled,
      "should not call addTeardown until the downstream map errors"
    );
    subscriber.next(2);
    assert_true(
      subscriber.closed,
      "should close the subscriber when the downstream map errors"
    );
    subscriber.next(3);
    subscriber.complete();
  });

  const mapped = source.map((value) => {
    if (value === 2) {
      throw error;
    }
    return value * 2;
  });

  assert_true(mapped instanceof Observable, "should return an Observable");

  assert_array_equals(results, [], "should not map until subscribed");
  assert_false(
    addTeardownCalled,
    "should not call addTeardown until the error fires"
  );

  mapped.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_true(
    addTeardownCalled,
    "should call addTeardown after the downstream map errors"
  );
  assert_array_equals(
    results,
    [2, error],
    "should map values and emit the error"
  );
}, "should emit an error if the projection function throws");

test(() => {
  const error = new Error("error");
  const results = [];
  let projectionCalls = 0;

  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
    subscriber.next(3);
  });

  const mapped = source.map((value) => {
    projectionCalls++;
    return value * 2;
  });

  assert_true(mapped instanceof Observable, "should return an Observable");
  assert_array_equals(results, [], "should not map until subscribed");
  assert_equals(projectionCalls, 0, "should not call the projection function");

  mapped.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_equals(
    projectionCalls,
    2,
    "should call the projection function for each value prior to the error"
  );
  assert_array_equals(
    results,
    [2, 4, error],
    "should map values and emit the error"
  );
}, "should pass through errors from the source Observable");
