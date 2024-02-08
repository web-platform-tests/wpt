// Because we test that the global error handler is called at various times.
setup({ allow_uncaught_exception: true });

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.complete();
  });

  const results = [];

  source
    .filter((value) => value % 2 === 0)
    .subscribe({
      next: (value) => results.push(value),
      error: () => results.push("error"),
      complete: () => results.push("complete"),
    });

  assert_array_equals(results, [2, 4, "complete"]);
}, "observable filter result should filter out values based on a predicate");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.complete();
  });

  const results = [];

  source
    .filter(() => {
      throw new Error("error while filtering");
    })
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    ["error while filtering"],
    "errors thrown in observable filter predicate should be caught and sent to error callback"
  );
}, "errors thrown in observable filter predicate should be caught and sent to error callback");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source
    .filter(() => true)
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
  const unsubscribeCalls = 0;

  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      unsubscribeCalls++;
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.complete();
  });

  const results = [];

  const controller = new AbortController();
  source
    .filter(() => {
      if (value === 3) {
        controller.abort();
      }
      return true;
    })
    .subscribe({
      next: (value) => results.push(value),
      error: () => results.push("error"),
      complete: () => results.push("complete"),
    });

  assert_array_equals(results, [1, 2, "error"]);
  assert_equals(
    unsubscribeCalls,
    1,
    "unsubscribing from the result of observable filter should unsubscribe from the source observable"
  );
}, "unsubscribing from the result of observable filter should unsubscribe from the source observable");
