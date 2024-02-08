// Because we test that the global error handler is called at various times.
setup({ allow_uncaught_exception: true });

// Discussion here: https://github.com/WICG/observable/issues/111

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  const result = source.do({
    next: (value) => results.push(value),
    error: () => results.push("error"),
    complete: () => results.push("complete"),
  });

  result.subscribe();
  result.subscribe();

  assert_array_equals(
    results,
    [1, 2, 3, "complete", 1, 2, 3, "complete"],
    "observable do should provide a way to tap into the values and completions of the source observable"
  );
}, "observable do should provide a way to tap into the values and completions of the source observable using an observer");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  const result = source.do({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  result.subscribe();
  result.subscribe();

  assert_array_equals(
    results,
    [1, 2, 3, "error from source", 1, 2, 3, "error from source"],
    "observable do should provide a way to tap into the values and errors of the source observable"
  );
}, "observable do should provide a way to tap into the values and errors of the source observable using an observer");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const results = [];

  const result = source.do((value) => results.push(value));

  result.subscribe();
  result.subscribe();

  assert_array_equals(
    results,
    [1, 2, 3, 1, 2, 3],
    "observable do should provide a way to tap into the values of the source observable"
  );
}, "observable do should provate a way to tap into the values of a source observable using a function");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
  });

  const result = source.do({
    next: (value) => {
      if (value === 2) {
        throw new Error("error from do next handler");
      }
    },
  });

  const results1 = [];
  result.subscribe({
    next: (value) => results1.push(value),
    error: (e) => results1.push(e.message),
    complete: () => results1.push("complete"),
  });

  const results2 = [];
  result.subscribe({
    next: (value) => results2.push(value),
    error: (e) => results2.push(e.message),
    complete: () => results2.push("complete"),
  });

  assert_array_equals(
    results1,
    [1, "error from do next handler"],
    "throwing an error in the observer next handler in do should be caught and sent to the error callback of the result observable"
  );

  assert_array_equals(
    results2,
    [1, "error from do next handler"],
    "throwing an error in the observer next handler in do should be caught and sent to the error callback of the result observable"
  );
}, "throwing an error in the observer next handler in do should be caught and sent to the error callback of the result observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  const result = source.do({
    error: () => {
      throw new Error("error from do error handler");
    },
  });

  const results = [];
  result.subscribe({
    next: () => results.push("next"),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    ["error from do error handler"],
    "throwing an error in the observer error handler in do should be caught and sent to the error callback of the result observable"
  );
}, "throwing an error in the observer error handler in do should be caught and sent to the error callback of the result observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const result = source.do({
    complete: () => {
      throw new Error("error from do complete handler");
    },
  });

  const results = [];
  result.subscribe({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, 2, 3, "error from do complete handler"],
    "throwing an error in the observer complete handler in do should be caught and sent to the error callback of the result observable"
  );
}, "throwing an error in the observer complete handler in do should be caught and sent to the error callback of the result observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
  });

  const result = source.do({
    next: (value) => {
      if (value === 2) {
        throw new Error("error from do next handler");
      }
    },
  });

  const results = [];
  result.subscribe({
    next: (value) => results.push(value),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    [1, "error from do next handler"],
    "throwing an error in the next handler function in do should be caught and sent to the error callback of the result observable"
  );
}, "throwing an error in the next handler function in do should be caught and sent to the error callback of the result observable");

test(() => {
  const logs = [];
  let sourceSubscriptionCall = 0;
  const source = new Observable((subscriber) => {
    sourceSubscriptionCall++;
    logs.push(`source subscribe ${sourceSubscriptionCall}`);
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  let doSubscribeCall = 0;
  const result = source.do({
    subscribe: () => {
      doSubscribeCall++;
      logs.push(`do subscribe ${doSubscribeCall}`);
    },
    next: (value) => logs.push(`do next ${value}`),
    error: (e) => logs.push(`do error ${e.message}`),
    complete: () => logs.push(`do complete`),
  });

  result.subscribe({
    next: (value) => logs.push(`result next ${value}`),
    error: (e) => logs.push(`result error ${e.message}`),
    complete: () => logs.push(`result complete`),
  });

  result.subscribe({
    next: (value) => logs.push(`result next ${value}`),
    error: (e) => logs.push(`result error ${e.message}`),
    complete: () => logs.push(`result complete`),
  });

  assert_array_equals(
    logs,
    [
      "do subscribe 1",
      "source subscribe 1",
      "do next 1",
      "result next 1",
      "do next 2",
      "result next 2",
      "do next 3",
      "result next 3",
      "do complete",
      "result complete",
      "source subscribe 2",
      "do subscribe 2",
      "do next 1",
      "result next 1",
      "do next 2",
      "result next 2",
      "do next 3",
      "result next 3",
      "do complete",
      "result complete",
    ],
    "do should provide a way to tap into the moment a source observable is subscribed to, properly ordered"
  );
}, "do should provide a way to tap into the moment a source observable is subscribed to");

test(() => {
  const source = new Observable((subscriber) => {});

  const result = source.do({
    subscribe: () => {
      throw new Error("error from do subscribe handler");
    },
  });

  const results = [];
  result.subscribe({
    next: () => results.push("next"),
    error: (e) => results.push(e.message),
    complete: () => results.push("complete"),
  });

  assert_array_equals(
    results,
    ["error from do subscribe handler"],
    "errors thrown in observable do subscribe handler should be caught and sent to error callback"
  );
}, "errors thrown in observable do subscribe handler should be caught and sent to error callback");

test(() => {
  const logs = [];
  let sourceTeardownCall = 0;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      sourceTeardownCall++;
      logs.push(`source teardown ${sourceTeardownCall}`);
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  let doUnsubscribeCall = 0;
  const result = source.do({
    abort: (reason) => {
      doUnsubscribeCall++;
      logs.push(`do abort ${doUnsubscribeCall} ${reason}`);
    },
    next: (value) => logs.push(`do next ${value}`),
    error: (e) => logs.push(`do error ${e.message}`),
    complete: () => logs.push(`do complete`),
  });

  const controller = new AbortController();
  result.subscribe(
    {
      next: (value) => {
        logs.push(`result next ${value}`);
        if (value === 2) {
          controller.abort("abort reason");
        }
      },
      error: (e) => logs.push(`result error ${e.message}`),
      complete: () => logs.push(`result complete`),
    },
    {
      signal: controller.signal,
    }
  );

  assert_array_equals(
    logs,
    [
      "do next 1",
      "result next 1",
      "do next 2",
      "result next 2",
      "do abort 1 abort reason'",
      "source teardown 1",
    ],
    "do should provide a way to tap into the moment a source observable is unsubscribed from"
  );
}, "do should provide a way to tap into the moment a source observable is unsubscribed from");

test(() => {
  const logs = [];
  let sourceTeardownCall = 0;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      sourceTeardownCall++;
      logs.push(`source teardown ${sourceTeardownCall}`);
    });
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  let doUnsubscribeCall = 0;
  const result = source.do({
    next: (value) => logs.push(`do next ${value}`),
    complete: () => logs.push(`do complete`),
    abort: (reason) => {
      doUnsubscribeCall++;
      logs.push(`do abort ${doUnsubscribeCall} ${reason}`);
    },
  });

  result.subscribe({
    next: (value) => logs.push(`result next ${value}`),
    complete: () => logs.push(`result complete`),
  });

  assert_array_equals(
    logs,
    [
      "do next 1",
      "result next 1",
      "do next 2",
      "result next 2",
      "do next 3",
      "result next 3",
      "do complete",
      "result complete",
      "source teardown 1",
    ],
    "do should provide a way to tap into the moment a source observable is unsubscribed from"
  );
}, "do abort handler should not be called if the source completes before the result is unsubscribed from");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
  });

  const result = source.do({
    abort: () => {
      throw new Error("error from do subscribe handler");
    },
  });

  const controller = new AbortController();

  const results = [];
  result.subscribe(
    {
      next: (value) => {
        results.push(value);
        controller.abort();
      },
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    },
    { signal: controller.signal }
  );

  assert_array_equals(
    results,
    [1, "error from do subscribe handler"],
    "errors thrown in observable do abort handler should be caught and sent to error callback"
  );
}, "errors thrown in observable do abort handler should be caught and sent to error callback");
