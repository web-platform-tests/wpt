// META: title=Observable sharing proposal: observer error isolation
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

setup({allow_uncaught_exception: true});

promise_test(async t => {
  const reason = new Error("observer failure");
  const reported = new Promise(resolve => {
    const listener = t.step_func(event => {
      event.preventDefault();
      assert_equals(event.error, reason);
      resolve();
    });
    self.addEventListener("error", listener);
    t.add_cleanup(() => self.removeEventListener("error", listener));
  });
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  source.subscribe(() => { throw reason; });
  const log = [];
  source.subscribe({next: v => log.push(v), complete: () => log.push("complete")});
  sink.next(1);
  assert_true(sink.active);
  sink.complete();
  await reported;
  assert_array_equals(log, [1, "complete"]);
}, "An observer exception is reported globally without stopping shared delivery or production");

promise_test(async t => {
  const reason = new Error("obsolete producer error");
  const reported = new Promise(resolve => {
    const listener = t.step_func(event => {
      event.preventDefault();
      assert_equals(event.error, reason);
      resolve();
    });
    self.addEventListener("error", listener);
    t.add_cleanup(() => self.removeEventListener("error", listener));
  });
  const sinks = [];
  const stop = new AbortController();
  const values = [];
  const source = new SharedObservable(s => sinks.push(s));
  source.subscribe({}, {signal: stop.signal});
  sinks[0].error(reason, {get close() {
    stop.abort();
    source.subscribe(value => values.push(value));
    return true;
  }});
  await reported;
  assert_true(sinks[1].active);
  sinks[1].next(42);
  assert_array_equals(values, [42]);
  sinks[1].complete();
  source.subscribe();
  assert_equals(sinks.length, 3);
  sinks[2].complete();
}, "error(): conversion can obsolete the producer; its error reports without closing the replacement");

promise_test(async t => {
  const reason = new Error("teardown failure");
  const reported = new Promise(resolve => {
    const listener = t.step_func(event => {
      event.preventDefault();
      assert_equals(event.error, reason);
      resolve();
    });
    self.addEventListener("error", listener);
    t.add_cleanup(() => self.removeEventListener("error", listener));
  });
  const log = [];
  new SharedObservable(s => {
    s.addTeardown(() => log.push("first"));
    s.addTeardown(() => { log.push("second"); throw reason; });
    s.complete();
  }).subscribe({complete: () => log.push("complete")});
  await reported;
  assert_array_equals(log, ["second", "first", "complete"]);
}, "A throwing shared teardown does not suppress remaining cleanup or completion");
