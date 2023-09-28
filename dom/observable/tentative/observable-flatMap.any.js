test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  let projectionCalls = 0;

  const results = [];

  const flattened = source.flatMap((value) => {
    projectionCalls++;
    return new Observable((subscriber) => {
      subscriber.next(value * 10);
      subscriber.next(value * 100);
      subscriber.complete();
    });
  });

  assert_true(flattened instanceof Observable, "should return an Observable");
  assert_array_equals(results, [], "should not map until subscribed");

  flattened.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_equals(
    projectionCalls,
    3,
    "should call the projection function for each source value"
  );
  assert_array_equals(
    results,
    [10, 100, 20, 200, 30, 300, "done"],
    "should map then flatten values"
  );
}, "should map then flatten observables");

test(() => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(error);
    subscriber.next(3);
  });

  const flattened = source.flatMap((value) => {
    return new Observable((subscriber) => {
      subscriber.next(value * 10);
      subscriber.next(value * 100);
      subscriber.complete();
    });
  });

  const results = [];

  flattened.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_array_equals(
    results,
    [10, 100, 20, 200, error],
    "should map then flatten values, passing through the error from the source"
  );
}, "should pass through errors from the source");

test(() => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    assert_true(
      subscriber.closed,
      "should close the subscriber when the inner synchronously errors below"
    );
    subscriber.next(3);
    subscriber.complete();
  });

  const flattened = source.flatMap((value) => {
    return new Observable((subscriber) => {
      subscriber.next(value * 10);
      subscriber.next(value * 100);
      if (value === 2) {
        subscriber.error(error);
      } else {
        subscriber.complete();
      }
    });
  });

  const results = [];

  flattened.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_array_equals(
    results,
    [10, 100, 20, 200, error],
    "should map then flatten values, passing through the error from the source"
  );
}, "it should pass through errors from the mapped observables");

test(() => {
  const error = new Error("error");
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    assert_true(
      subscriber.closed,
      "should close the subscriber when the inner synchronously errors below"
    );
    subscriber.next(3);
    subscriber.complete();
  });

  const flattened = source.flatMap((value) => {
    if (value === 3) {
      throw error;
    }
    return new Observable((subscriber) => {
      subscriber.next(value * 10);
      subscriber.next(value * 100);
      subscriber.complete();
    });
  });

  const results = [];

  flattened.subscribe({
    next: (value) => results.push(value),
    error: (error) => results.push(error),
    complete: () => assert_unreached("should not complete"),
  });

  assert_array_equals(
    results,
    [10, 100, 20, 200, error],
    "should map then flatten values, passing through the error from the source"
  );
}, "it should emit errors thrown in the mapping function");

test(() => {
  const source = createTestSubject();
  const inner1 = createTestSubject();
  const inner2 = createTestSubject();

  const flattened = source.flatMap((value) => {
    switch (value) {
      case 1:
        return inner1;
      case 2:
        return inner2;
      default:
        assert_unreached("should not be called");
    }
  });

  const results = [];

  flattened.subscribe({
    next: (value) => results.push(value),
    error: () => assert_unreached("should not error"),
    complete: () => results.push("done"),
  });

  assert_array_equals(results, []);

  source.next(1);

  assert_equals(
    inner1.subscriberCount(),
    1,
    "should subscribe to the first inner observable"
  );

  source.next(2);

  assert_equals(
    inner2.subscriberCount(),
    2,
    "should subscribe to the second inner observable until the first completes"
  );

  assert_array_equals(results, []);

  inner1.next(100);
  inner1.next(101);

  assert_array_equals(results, [100, 101]);

  inner1.complete();
  assert_equals(
    inner1.subscriberCount(),
    0,
    "should unsubscribe from the first"
  );
  assert_equals(
    inner2.subscriberCount(),
    1,
    "should subscribe to the second inner observable until the first completes"
  );

  inner2.next(200);
  inner2.next(201);
  assert_array_equals(results, [100, 101, 200, 201]);

  inner2.complete();
  assert_equals(
    inner2.subscriberCount(),
    0,
    "should unsubscribe from the second"
  );
  assert_equals(
    source.subscriberCount(),
    1,
    "should not unsubscribe from the source yet"
  );
  assert_array_equals(results, [100, 101, 200, 201]);

  source.complete();
  assert_equals(
    source.subscriberCount(),
    0,
    "should unsubscribe from the source"
  );
  assert_array_equals(results, [
    100,
    101,
    200,
    201,
    "done",
    "result completes when all inners and the source complete",
  ]);
}, "It should not complete until the source and all inner observables complete");

test(() => {
  const source = createTestSubject();
  const inner = createTestSubject();
  const result = source.flatMap(() => inner);

  const ac = new AbortController();

  result.subscribe({
    signal: ac.signal,
  });

  assert_equals(source.subscriberCount(), 1, "should subscribe to the source");
  assert_equals(
    inner.subscriberCount(),
    0,
    "should not subscribe to the inner yet"
  );

  source.next(1);

  assert_equals(
    inner.subscriberCount(),
    1,
    "should subscribe to the inner when the source emits"
  );

  ac.abort();

  assert_equals(
    source.subscriberCount(),
    0,
    "should unsubscribe from the source when the subscription is aborted"
  );

  assert_equals(
    inner.subscriberCount(),
    0,
    "should unsubscribe from the inner when the subscription is aborted"
  );
}, "It should unsubscribe from source and the active inner when the resulting subscription is aborted");

/**
 * A helper function to create an Observable that can be
 * externally controlled and examined for testing purposes.
 */
function createTestSubject() {
  const subscribers = new Set();
  const subject = new Observable((subscriber) => {
    subscribers.add(subscriber);
    subscriber.addTeardown(() => {
      subscribers.delete(subscriber);
    });
  });
  subject.next = (value) => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.next(value);
    }
  };
  subject.error = (error) => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.error(error);
    }
  };
  subject.complete = () => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.complete();
    }
  };
  subject.subscriberCount = () => {
    return subscribers.size;
  };
}
