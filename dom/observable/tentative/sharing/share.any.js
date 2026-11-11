// META: title=Observable sharing proposal: sharing configuration and boundaries
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

test(() => {
  let starts = 0;
  let cleanups = 0;
  const source = new Observable(s => {
    ++starts;
    s.addTeardown(() => ++cleanups);
  });
  const shared = source.share();
  const a = new AbortController();
  const b = new AbortController();
  assert_equals(starts, 0);
  shared.subscribe({}, {signal: a.signal});
  shared.subscribe({}, {signal: b.signal});
  assert_equals(starts, 1);
  a.abort();
  assert_equals(cleanups, 0);
  b.abort();
  assert_equals(cleanups, 1);
  const c = new AbortController();
  shared.subscribe({}, {signal: c.signal});
  assert_equals(starts, 2);
  c.abort();
}, "share(): one lazy execution remains until its last observer cancels, then can restart");

test(() => {
  let starts = 0;
  const source = new Observable(s => { ++starts; });
  const a = source.share();
  const b = source.share();
  const stop = new AbortController();
  assert_not_equals(a, b);
  a.subscribe({}, {signal: stop.signal});
  b.subscribe({}, {signal: stop.signal});
  assert_equals(starts, 2);
  stop.abort();
}, "Separate share() calls on ordinary input establish independent boundaries");

for (const maxReplayValues of [-1, 0.5, Infinity, -Infinity, NaN, 2 ** 53]) {
  test(() => {
    assert_throws_js(RangeError, () => new SharedObservable({producer() {}, maxReplayValues}));
    const source = new Observable(() => {});
    assert_throws_js(RangeError, () => source.share({maxReplayValues}));
    const shared = source.share();
    assert_throws_js(RangeError, () => shared.share({maxReplayValues}));
  }, `Sharing configuration rejects replay capacity ${maxReplayValues}`);
}

test(() => {
  const config = {producer() {}, closeOnLastUnsubscribe: 1, keepAliveOnLastUnsubscribe: {}};
  assert_throws_js(TypeError, () => new SharedObservable(config));
  assert_throws_js(TypeError, () => new Observable(() => {}).share(config));
}, "Sharing configuration rejects both enabled last-unsubscribe flags after boolean conversion");

for (const [enabled, opposite] of [
  ["keepAliveOnLastUnsubscribe", "closeOnLastUnsubscribe"],
  ["closeOnLastUnsubscribe", "keepAliveOnLastUnsubscribe"],
]) {
  test(() => {
    const source = new SharedObservable({producer() {}, [enabled]: true});
    assert_equals(source.share(), source);
    assert_equals(source.share({[enabled]: undefined}), source);
    assert_throws_js(TypeError, () => source.share({[opposite]: true}));
    assert_not_equals(source.share({[enabled]: false, [opposite]: true}), source);
  }, `share(): inherited ${enabled} must be explicitly disabled before enabling its opposite`);
}

for (const key of ["maxReplayValues", "closeOnComplete", "closeOnError",
                   "closeOnLastUnsubscribe", "keepAliveOnLastUnsubscribe"]) {
  test(() => {
    const value = key === "maxReplayValues" ? 2 : true;
    const source = new SharedObservable({producer() {}, [key]: value});
    assert_equals(source.share({[key]: undefined}), source);
    assert_equals(source.share({[key]: key === "maxReplayValues" ? "2" : 1}), source);
    assert_not_equals(source.share({[key]: key === "maxReplayValues" ? 0 : false}), source);
  }, `share(): identity comparison includes normalized ${key}`);
}

test(() => {
  let starts = 0;
  const reads = {};
  const config = {producer(s) { ++starts; s.complete({close: true}); }};
  const keys = ["maxReplayValues", "closeOnComplete", "closeOnError",
                "closeOnLastUnsubscribe", "keepAliveOnLastUnsubscribe"];
  for (const key of keys) {
    Object.defineProperty(config, key, {get() {
      reads[key] = (reads[key] || 0) + 1;
      return key === "maxReplayValues" ? 0 : false;
    }});
  }
  const source = new SharedObservable(config);
  for (const key of keys) assert_equals(reads[key], 1, key);
  source.subscribe();
  assert_equals(source.share(config), source);
  for (const key of keys) assert_equals(reads[key], 2, key);
  source.subscribe();
  assert_equals(starts, 1);
}, "Configuration is read once per call, including an identity return after permanent closure");

test(() => {
  let sink;
  let starts = 0;
  const source = new SharedObservable({
    maxReplayValues: 1,
    producer(s) { sink = s; ++starts; },
  });
  source.subscribe();
  sink.next(1);
  sink.next(2);
  const wrapper = source.share({maxReplayValues: 3});
  const values = [];
  assert_equals(starts, 1);
  wrapper.subscribe(value => values.push(value));
  assert_array_equals(values, [2], "A wrapper cannot recover discarded history");
  sink.next(3);
  assert_array_equals(values, [2, 3]);
  assert_equals(starts, 1, "The wrapper observes the original, not a copy of its producer");
  sink.complete();
}, "Different sharing settings create a lazy forwarding wrapper");

for (const kind of ["complete", "error"]) {
  test(() => {
    const reason = {};
    let starts = 0;
    const source = new SharedObservable({
      maxReplayValues: 1,
      producer(s) {
        ++starts;
        s.next(42);
        if (kind === "complete") s.complete({close: true});
        else s.error(reason, {close: true});
      },
    });
    const wrapper = source.share({maxReplayValues: 2});
    const log = [];
    const observer = {
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    };
    wrapper.subscribe(observer);
    wrapper.subscribe(observer);
    assert_equals(starts, 1);
    assert_array_equals(log, [42, kind === "complete" ? "complete" : reason,
                              42, kind === "complete" ? "complete" : reason]);
    assert_array_equals(wrapper.replayValues, [], "Producer close is not forwarded to the wrapper");
  }, `A wrapper cannot reopen a source closed by ${kind}, and chooses its own terminal policy`);
}
