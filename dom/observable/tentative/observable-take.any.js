test(() => {
  let logs = [];
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      logs.push("source teardown");
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const result = source.take(2);

  result.subscribe({
    next: (v) => logs.push(v),
    error: (e) => logs.push(e.message),
    complete: () => logs.push("complete"),
  });

  assert_array_equals(
    logs,
    [1, 2, "source teardown", "complete"],
    "observable take should take the first N values from the source observable, then complete"
  );
}, "observable take should take the first N values from the source observable, then complete");

test(() => {
  let logs = [];
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const result = source.take(5);

  result.subscribe({
    next: (v) => logs.push(v),
    error: (e) => logs.push(e.message),
    complete: () => logs.push("complete"),
  });

  assert_array_equals(
    logs,
    [1, 2, 3, "complete"],
    "should mirror all values from source if the take count is greater than the number of values"
  );
}, "take should forward completes that happen before the take count is met");

test(() => {
  let logs = [];
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.error(new Error("error from source"));
  });

  const result = source.take(100);

  result.subscribe({
    next: (v) => logs.push(v),
    error: (e) => logs.push(e.message),
    complete: () => logs.push("complete"),
  });

  assert_array_equals(
    logs,
    [1, "error from source"],
    "take should forward errors from the source observable"
  );
}, "take should forward errors from the source observable");

test(() => {
  let logs = [];
  const source = new Observable((subscriber) => {
    logs.push("source subscribe");
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const result = source.take(0);

  result.subscribe({
    next: (v) => logs.push(v),
    error: (e) => logs.push(e.message),
    complete: () => logs.push("complete"),
  });

  assert_array_equals(
    logs,
    ["complete"],
    "take 0 should not subscribe to the source observable, and should return an observable that immediately completes"
  );
}, "take 0 should not subscribe to the source observable, and should return an observable that immediately completes");

test(() => {
  let logs = [];
  const source = new Observable((subscriber) => {
    logs.push("source subscribe");
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const result = source.take(-1);

  result.subscribe({
    next: (v) => logs.push(v),
    error: (e) => logs.push(e.message),
    complete: () => logs.push("complete"),
  });

  assert_array_equals(
    logs,
    ["complete"],
    "take 0 should not subscribe to the source observable, and should return an observable that immediately completes"
  );
}, "take with a negative count should not subscribe to the source observable, and should return an observable that immediately completes");
