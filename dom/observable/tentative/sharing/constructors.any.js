// META: title=Observable sharing proposal: constructors and API surface
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const name of ["Observable", "SharedObservable"]) {
  for (const objectForm of [false, true]) {
    test(() => {
      assert_implements(self[name], `${name} must be implemented`);
      let starts = 0;
      const producer = s => { ++starts; s.complete(); };
      const source = new self[name](objectForm ? {producer} : producer);
      assert_equals(starts, 0);
      assert_equals(source.subscribe(), undefined);
      assert_equals(starts, 1);
    }, `${name}: ${objectForm ? "configuration" : "callback"} construction is lazy`);
  }

  for (const [label, input] of [
    ["undefined", undefined], ["null", null], ["empty configuration", {}],
    ["non-callable producer", {producer: 1}], ["number", 1],
  ]) {
    test(() => {
      assert_implements(self[name], `${name} must be implemented`);
      assert_throws_js(TypeError, () => new self[name](input));
    }, `${name}: rejects ${label}`);
  }

  test(() => {
    let starts = 0;
    const log = [];
    const source = new self[name](s => {
      ++starts;
      s.next(1);
      s.complete();
    });
    source.subscribe({
      next: value => log.push(value),
      complete: () => log.push("complete"),
    }, {signal: AbortSignal.abort()});
    assert_equals(starts, 0);
    assert_array_equals(log, []);
  }, `${name}: an already-aborted observation never invokes the producer`);
}

test(() => {
  const sinks = [];
  const a = new AbortController();
  const source = new Observable(s => sinks.push(s));
  source.subscribe({}, {signal: a.signal});
  source.subscribe();
  assert_equals(sinks.length, 2);
  assert_not_equals(sinks[0], sinks[1]);
  assert_not_equals(sinks[0].signal, sinks[1].signal);
  a.abort();
  assert_false(sinks[0].active);
  assert_true(sinks[1].active);
  sinks[1].complete();
}, "Observable: overlapping subscriptions have independent producers and cancellation");

test(() => {
  const sinks = [];
  const source = new Observable(s => sinks.push(s));
  source.subscribe();
  source.subscribe();
  sinks[0].complete({close: true});
  assert_true(sinks[1].active);
  source.subscribe();
  assert_equals(sinks.length, 3);
  sinks[1].complete();
  sinks[2].complete();
}, "Observable: producer-selected closure affects neither siblings nor future subscriptions");

test(() => {
  assert_equals(SharedObservable.from, undefined);
  const source = new SharedObservable(() => {});
  for (const name of ["next", "complete", "error", "close"]) {
    assert_equals(source[name], undefined, `${name} is not a consumer method`);
  }
}, "SharedObservable exposes observation without producer termination methods or static from");

for (const name of ["Observable", "SharedObservable"]) {
  test(() => {
    const source = new self[name](() => {});
    for (const method of ["toArray", "forEach", "every", "some", "first", "last", "find", "reduce"]) {
      assert_equals(source[method], undefined, `${method} is omitted`);
    }
  }, `${name}: Promise-returning consumption methods are omitted`);
}
