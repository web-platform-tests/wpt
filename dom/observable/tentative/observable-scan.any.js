test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const reducerCalls = 0;
  const reducerArgs = [];
  const results = [];

  source
    .scan((acc, value, index) => {
      reducerCalls++;
      reducerArgs.push(acc, value, index);
      return acc + value;
    }, 0)
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_equals(
    reducerCalls,
    3,
    "observable scan should call the reducer once for each value emitted by the source observable"
  );
  assert_array_equals(
    reducerArgs,
    [0, 1, 0, 1, 2, 1, 3, 3, 2],
    "observable scan should call the reducer with the current state, the current value, and the current index"
  );
  assert_array_equals(
    results,
    [1, 3, 6, "complete"],
    "observable scan should reduce and emit state changes by processing values from the source observable, mirroring completion"
  );
}, "observable scan should reduce and emit state changes by processing values from the source observable, mirroring completion");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.error(new Error("error from source"));
  });

  const reducerCalls = 0;
  const reducerArgs = [];
  const results = [];

  source
    .scan((acc, value, index) => {
      reducerCalls++;
      reducerArgs.push(acc, value, index);
      return acc + value;
    }, 0)
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_equals(
    reducerCalls,
    3,
    "observable scan should call the reducer once for each value emitted by the source observable"
  );
  assert_array_equals(
    reducerArgs,
    [0, 1, 0, 1, 2, 1, 3, 3, 2],
    "observable scan should call the reducer with the current state, the current value, and the current index"
  );
  assert_array_equals(
    results,
    [1, 3, 6, "error from source"],
    "observable scan should reduce and emit state changes by processing values from the source observable, mirroring errors"
  );
}, "observable scan should reduce and emit state changes by processing values from the source observable, mirroring errors");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  const reducerCalls = 0;
  const reducerArgs = [];
  const results = [];

  source
    .scan((acc, value, index) => {
      reducerCalls++;
      reducerArgs.push(acc, value, index);
      return acc + value;
    })
    .subscribe({
      next: (value) => results.push(value),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_equals(
    reducerCalls,
    2,
    "observable scan should call the reducer once for each value emitted by the source observable"
  );
  assert_array_equals(
    reducerArgs,
    [1, 2, 1, 3, 3, 2],
    "observable scan should call the reducer with the current state, the current value, and the current index"
  );
  assert_array_equals(
    results,
    [1, 3, 6, "complete"],
    "observable scan should reduce and emit state changes by processing values from the source observable, mirroring completion"
  );
}, "if no initial state is provided, scan should use and emit the first value from the source observable as the initial state");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
  });

  const results = [];

  source
    .scan((acc, value) => {
      if (value === 2) {
        throw new Error("error while reducing");
      }
      return acc + value;
    }, 0)
    .subscribe({
      next: () => results.push("next"),
      error: (e) => results.push(e.message),
      complete: () => results.push("complete"),
    });

  assert_array_equals(
    results,
    [1, "error while reducing"],
    "if an error is thrown in the reducer, it should be caught and sent to the error callback"
  );
}, "if an error is thrown in the reducer, it should be caught and sent to the error callback");

test(() => {
  let teardownCalls = 0;
  const source = new Observable((subscriber) => {
    subscriber.addTeardown(() => {
      teardownCalls++;
    });
  });

  const controller = new AbortController();

  source
    .scan(() => 0)
    .subscribe(
      {},
      {
        signal: controller.signal,
      }
    );

  assert_equals(
    teardownCalls,
    0,
    "unsubscribing from the result of scan should unsubscribe from the source observable"
  );

  controller.abort();

  assert_equals(
    teardownCalls,
    1,
    "unsubscribing from the result of scan should unsubscribe from the source observable"
  );
}, "unsubscribing from the result of scan should unsubscribe from the source observable");

test(() => {
  const source = new Observable((subscriber) => {
    subscriber.error(new Error("error from source"));
  });

  const results = [];

  source
    .scan(() => 0)
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
}, "if no initial state is provided, and the source observable errors before it emits a value, the result should forward the error");
