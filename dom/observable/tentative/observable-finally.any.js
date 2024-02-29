test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  source
    .finally(() => {
      results.push("finally called");
    })
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    [1, 2, 3, "complete", "finally called"],
    "errors thrown in the finally handler should be forwarded to the result observable"
  );
}, "finally should mirror all values and completions from the source");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source
    .finally(() => {
      results.push("finally called");
    })
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    [1, 2, 3, "error from source", "finally called"],
    "errors thrown in the finally handler should be forwarded to the result observable"
  );
}, "finally should mirror all values and errors from the source");

test(() => {
  const logs = [];

  const source = new Observable((subscriber) => {
    logs.push("source subscribe");
    subscriber.addTeardown(() => logs.push("source teardown"));
    logs.push("source send complete");
    subscriber.complete();
  });

  const result = source.finally(() => {
    logs.push("finally handler");
  });

  result.subscribe({
    complete: () => logs.push("result complete"),
  });

  assert_array_equals(
    logs,
    [
      "source subscribe",
      "source send complete",
      "result complete",
      "source teardown",
      "finally handler",
    ],
    "observable finally handler should fire after the source observable completes"
  );
}, "observable finally handler should fire after the source observable completes");

test(() => {
  const logs = [];

  const source = new Observable((subscriber) => {
    logs.push("source subscribe");
    subscriber.addTeardown(() => logs.push("source teardown"));
    logs.push("source send error");
    subscriber.error(new Error("error from source"));
  });

  const result = source.finally(() => {
    logs.push("finally handler");
  });

  result.subscribe({
    error: (e) => logs.push(e.message),
  });

  assert_array_equals(
    logs,
    [
      "source subscribe",
      "source send error",
      "error from source",
      "source teardown",
      "finally handler",
    ],
    "finally handler should fire after the source observable errors"
  );
}, "finally handler should fire after the source observable errors");

test(() => {
  const logs = [];

  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  const result = source
    .finally(() => {
      logs.push("finally handler 1");
    })
    .finally(() => {
      logs.push("finally handler 2");
    });

  result.subscribe({ complete: () => logs.push("result complete") });

  assert_array_equals(
    logs,
    ["result complete", "finally handler 1", "finally handler 2"],
    "finally handlers should be called in the order they are composed"
  );
}, "finally handlers should be called in the order they are composed");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.complete();
  });

  const results = [];

  source
    .finally(() => {
      throw new Error("error from finally");
    })
    .subscribe({
      next: () => results.push("next"),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    ["error from finally"],
    "errors thrown in the finally handler should be forwarded to the result observable"
  );
}, "errors thrown in the finally handler should be forwarded to the result observable");

test(() => {
  const logs = [];

  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      logs.push("source teardown");
    });
  });

  const controller = new AbortController();

  source
    .finally(() => {
      logs.push("finally handler");
    })
    .subscribe({}, { signal: controller.signal });

  controller.abort();

  assert_array_equals(
    logs,
    ["source teardown", "finally handler"],
    "finally handler should be called if consumer aborts the subscription"
  );
}, "finally handler should be called if consumer aborts the subscription");

test(() => {
  // This one is more about getting the implementation of `flatMap` correct than `finally`.
  // But it's still important.
  const logs = [];
  const result = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
  }).flatMap((value) => {
    logs.push(`flatMap ${value}`);
    return new Observable((subscriber) => {
      subscriber.next(value);
      subscriber.next(value);
      subscriber.next(value);
      subscriber.complete();
    }).finally(() => {
      logs.push(`finally ${value}`);
    });
  });

  result.subscribe({
    next: (value) => logs.push(`result ${value}`),
    complete: () => logs.push("result complete"),
  });

  assert_array_equals(
    logs,
    [
      "flatMap 1",
      "result 1",
      "result 1",
      "result 1",
      "finally 1",
      "flatMap 2",
      "result 2",
      "result 2",
      "result 2",
      "finally 2",
      "result complete",
    ],
    "finally should be called before the next inner subscription in a flatMap"
  );
}, "finally should be called before the next inner subscription in a flatMap");

test(() => {
  // This one is more about getting the implementation of `switchMap` correct than `finally`.
  // But it's still important.
  const logs = [];
  const result = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
  }).switchMap((value) => {
    logs.push(`switchMap ${value}`);
    return new Observable((subscriber) => {
      subscriber.next(value);
      subscriber.next(value);
      subscriber.next(value);
      subscriber.complete();
    }).finally(() => {
      logs.push(`finally ${value}`);
    });
  });

  result.subscribe({
    next: (value) => logs.push(`result ${value}`),
    complete: () => logs.push("result complete"),
  });

  assert_array_equals(
    logs,
    [
      "switchMap 1",
      "result 1",
      "result 1",
      "result 1",
      "finally 1",
      "switchMap 2",
      "result 2",
      "result 2",
      "result 2",
      "finally 2",
      "result complete",
    ],
    "finally should be called before the next inner subscription in a switchMap"
  );
}, "finally should be called before the next inner subscription in a switchMap");
