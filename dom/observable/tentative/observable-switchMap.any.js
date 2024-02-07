// Because we test that the global error handler is called at various times.
setup({ allow_uncaught_exception: true });

function createTestSubject() {
  const subscribers = new Set();
  const observable = new Observable((subscriber) => {
    subscribers.add(subscriber);
    subscriber.addTeardown(() => subscribers.delete(subscriber));
  });

  return {
    next(value) {
      for (const subscriber of subscribers) {
        subscriber.next(value);
      }
    },
    error(error) {
      for (const subscriber of subscribers) {
        subscriber.error(error);
      }
    },
    complete() {
      for (const subscriber of subscribers) {
        subscriber.complete();
      }
    },
    observable,
    activeCount() {
      return subscribers.size;
    },
  };
}

test(() => {
  const source = createTestSubject();
  const inner1 = createTestSubject();
  const inner2 = createTestSubject();

  const result = source.observable.switchMap((value, index) => {
    if (value === 1) {
      return inner1.observable;
    }
    if (value === 2) {
      return inner2.observable;
    }
    throw new Error("invalid value");
  });

  const results = [];

  result.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => results.push("complete"),
  });

  assert_equals(source.activeCount(), 1, "source observable is subscribed to");

  source.next(1);
  assert_equals(inner1.activeCount(), 1, "inner1 observable is subscribed to");

  inner1.next("a");
  assert_array_equals(results, ["a"], "first value is emitted");

  inner1.next("a");
  assert_array_equals(results, ["a", "a"], "second value is emitted");

  source.next(2);
  assert_equals(
    inner1.activeCount(),
    0,
    "inner1 observable is unsubscribed from"
  );
  assert_equals(inner2.activeCount(), 1, "inner2 observable is subscribed to");

  inner2.next("b");
  assert_array_equals(results, ["a", "a", "b"], "third value is emitted");

  inner2.next("b");
  assert_array_equals(results, ["a", "a", "b", "b"], "fourth value is emitted");

  inner2.complete();
  assert_array_equals(
    results,
    ["a", "a", "b", "b"],
    "Result does not complete until both source and inner observables complete"
  );

  source.complete();
  assert_array_equals(
    results,
    ["a", "a", "b", "b", "complete"],
    "Result completes when source observable completes"
  );
}, "switchMap result subscribes to one inner observable at a time, unsubscribing from the previous one");

test(() => {
  const source = createTestSubject();
  const inner = createTestSubject();

  const result = source.observable.switchMap(() => inner.observable);

  const results = [];

  result.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => results.push("complete"),
  });

  assert_equals(source.activeCount(), 1, "source observable is subscribed to");

  source.next(1);
  assert_equals(inner.activeCount(), 1, "inner observable is subscribed to");

  inner.next("a");
  assert_array_equals(results, ["a"], "first value is emitted");

  inner.next("a");
  assert_array_equals(results, ["a", "a"], "second value is emitted");

  source.complete();
  assert_array_equals(
    results,
    ["a", "a"],
    "does not complete when source observable completes, because inner is still active"
  );

  inner.next("a");
  assert_array_equals(results, ["a", "a", "a"], "third value is emitted");

  inner.complete();
  assert_array_equals(
    results,
    ["a", "a", "a", "complete"],
    "Result completes when inner observable completes, because source is already complete"
  );
}, "switchMap result does not complete when the source observable completes if the inner observable is still active");

test(() => {
  const source = createTestSubject();

  const result = source.observable.switchMap(() => {
    throw new Error("thrown from projection function");
  });

  const results = [];

  result.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error.message),
    complete: () => results.push("complete"),
  });

  assert_equals(source.activeCount(), 1, "source observable is subscribed to");

  source.next(1);
  assert_array_equals(
    results,
    ["thrown from projection function"],
    "switchMap emits an error if the projection function throws an error"
  );
  assert_equals(
    source.activeCount(),
    0,
    "source observable is unsubscribed from"
  );
}, "switchMap result emits an error if the projection function throws an error");

test(() => {
  const source = createTestSubject();
  const inner = createTestSubject();

  const result = source.observable.switchMap(() => inner.observable);

  const results = [];

  result.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error.message),
    complete: () => results.push("complete"),
  });

  assert_equals(source.activeCount(), 1, "source observable is subscribed to");

  source.next(1);
  assert_equals(inner.activeCount(), 1, "inner observable is subscribed to");

  inner.next("a");
  assert_array_equals(results, ["a"], "first value is emitted");

  source.error(new Error("error from source"));
  assert_array_equals(
    results,
    ["a", "error from source"],
    "switchMap result emits an error if the source emits an error"
  );
  assert_equals(
    inner.activeCount(),
    0,
    "inner observable is unsubscribed from"
  );
  assert_equals(
    source.activeCount(),
    0,
    "source observable is unsubscribed from"
  );
}, "switchMap result emits an error if the source emits an error");

test(() => {
  const source = createTestSubject();
  const inner = createTestSubject();

  const result = source.observable.switchMap(() => inner.observable);

  const results = [];

  result.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error.message),
    complete: () => results.push("complete"),
  });

  assert_equals(source.activeCount(), 1, "source observable is subscribed to");

  source.next(1);
  assert_equals(inner.activeCount(), 1, "inner observable is subscribed to");

  inner.next("a");
  assert_array_equals(results, ["a"], "first value is emitted");

  inner.error(new Error("error from inner"));
  assert_array_equals(
    results,
    ["a", "error from inner"],
    "switchMap result emits an error if the inner observable emits an error"
  );
  assert_equals(
    inner.activeCount(),
    0,
    "inner observable is unsubscribed from"
  );
  assert_equals(
    source.activeCount(),
    0,
    "source observable is unsubscribed from"
  );
}, "switchMap result emits an error if the inner observable emits an error");
