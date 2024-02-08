// Because we test that the global error handler is called at various times.
setup({ allow_uncaught_exception: true });

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];
  const projections = 0;
  const projectionArgs = [];

  source
    .map((value, index) => {
      projections++;
      projectionArgs.push(value, index);
      return value * 2;
    })
    .subscribe({
      next: (value) => results.push(value),
      error: () => results.push("error"),
      complete: () => results.push("complete"),
    });

  assert_array_equals(results, [2, 4, 6, "complete"]);
  assert_equals(projections, 3, "map projection called for each value");
  assert_array_equals(
    projectionArgs,
    [1, 0, 2, 1, 3, 2],
    "map projection args are correct"
  );
}, "observable map result should map values to new values");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  source
    .map(() => {
      throw new Error("error while projecting");
    })
    .subscribe({
      next: () => results.push("next"),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    ["error while projecting"],
    "errors thrown in observable map projection should be caught and sent to error callback"
  );
}, "errors thrown in observable map projection should be caught and sent to error callback");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source
    .map(() => 1)
    .subscribe({
      next: () => results.push("next"),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    ["error from source"],
    "errors from the source observable are passed through to the result observable"
  );
}, "errors from the source observable are passed through to the result observable");

test(() => {
  let unsubscriptions = 0;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      unsubscriptions++;
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
  });

  const result = source.map((value) => value * 2);
  const results = [];

  const controller = new AbortController();
  result.subscribe(
    (value) => {
      results.push(value);
      if (value === 2) {
        controller.abort();
      }
    },
    {
      signal: controller.signal,
    }
  );

  assert_equals(
    unsubscriptions,
    1,
    "unsubscription from result should unsubscribe from source"
  );
}, "unsubscribing from the result of observable map should unsubscribe from the source observable");
