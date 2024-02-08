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

  source.drop(2).subscribe({
    next: (value) => results.push(value),
    error: () => results.push("error"),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [3, 4, "complete"],
    "observable drop should skip the first n values from the source observable, then pass through the rest of the values and completion"
  );
}, "observable drop should skip the first n values from the source observable, then pass through the rest of the values and completion");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source.drop(2).subscribe({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [3, 4, "error from source"],
    "observable drop should pass through errors from source observable"
  );
}, "observable drop should pass through errors from source observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source.drop(2).subscribe({
    next: () => results.push("next"),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    ["error from source"],
    "observable drop should pass through errors from source observable even before drop count is met"
  );
}, "observable drop should pass through errors from source observable even before drop count is met");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.complete();
  });

  const results = [];

  source.drop(2).subscribe({
    next: () => results.push("next"),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    ["complete"],
    "observable drop should complete immediately if the source observable completes before the drop count is met"
  );
}, "observable drop should pass through completions from source observable even before drop count is met");

test(() => {
  let unsubscribeCalls = 0;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      unsubscribeCalls++;
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.next(5);
    subscriber.complete();
  });

  const results = [];

  const controller = new AbortController();

  source.drop(2).subscribe(
    {
      next: (value) => {
        results.push(value);
        if (value === 3) {
          controller.abort();
        }
      },
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    },
    {
      signal: controller.signal,
    }
  );

  assert_equals(
    unsubscribeCalls,
    1,
    "unsubscribing early from the result of observable drop should unsubscribe from the source observable"
  );

  assert_array_equals(
    results,
    [3],
    "observable drop should pass through the rest of the values and completion if aborted"
  );
}, "unsubscribing early from the result of observable drop should unsubscribe from the source observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  source.drop(0).subscribe({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, 3, "complete"],
    "passing 0 to observable drop should mirror the source observable"
  );
}, "passing 0 to observable drop should mirror the source observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  source.drop(-1).subscribe({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, 3, "complete"],
    "passing a negative number to observable drop should mirror the source observable"
  );
}, "passing a negative number to observable drop should mirror the source observable");
