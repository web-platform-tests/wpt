// META: title=Observable sharing proposal: optional introspection APIs
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221
// Inclusion of these inspection APIs remains an open design question.

for (const name of ["Observable", "SharedObservable"]) {
  test(() => {
    let starts = 0;
    const producer = () => ++starts;
    assert_equals(new self[name](producer).sharedSources, null);
    assert_equals(new self[name]({producer, sharedSources: []}).sharedSources, null);
    assert_equals(new self[name]({producer, sharedSources: null}).sharedSources, null);
    assert_equals(starts, 0);
  }, `${name}: no declared shared sources normalizes to null without starting work`);

  test(() => {
    const a = new SharedObservable(() => {});
    const b = new SharedObservable(() => {});
    const inputs = [a, b, a];
    const source = new self[name]({producer() {}, sharedSources: inputs});
    inputs.length = 0;
    assert_array_equals(source.sharedSources, [a, b]);
    assert_true(Object.isFrozen(source.sharedSources));
    assert_false(Object.isFrozen(a), "The referenced source is not deep-frozen");
    assert_false(source.sharedSources.includes(source));
  }, `${name}: declarations are copied, deduplicated in input order, and shallowly frozen`);

  test(() => {
    assert_throws_js(TypeError, () => new self[name]({
      producer() {}, sharedSources: [new Observable(() => {})],
    }));
    assert_throws_js(TypeError, () => new self[name]({producer() {}, sharedSources: [{}]}));
  }, `${name}: declared shared sources must be SharedObservable instances`);
}

test(() => {
  const a = new SharedObservable(() => {});
  const b = new SharedObservable(() => {});
  const c = new SharedObservable(() => {});
  const left = new Observable({producer() {}, sharedSources: [a, b]});
  const right = new Observable({producer() {}, sharedSources: [b, c]});
  assert_array_equals(a.map(v => v).sharedSources, [a]);
  assert_array_equals(left.filter(() => true).sharedSources, [a, b]);
  assert_array_equals(left.takeUntil(right).sharedSources, [a, b, c]);
  assert_array_equals(left.takeUntil(c).sharedSources, [a, b, c]);
  const boundary = left.share();
  assert_array_equals(boundary.sharedSources, [a, b]);
  assert_array_equals(boundary.map(v => v).sharedSources, [boundary]);
  assert_array_equals(boundary.share({maxReplayValues: 1}).sharedSources, [boundary]);
}, "Metadata propagates nearest shared boundaries and combines takeUntil inputs in order");

test(() => {
  const hidden = new SharedObservable(() => {});
  const source = new Observable(s => hidden.subscribe({}, {signal: s.signal}));
  assert_equals(source.sharedSources, null);
  const dynamic = Observable.from([1]).switchMap(() => hidden);
  const stop = new AbortController();
  dynamic.subscribe({}, {signal: stop.signal});
  assert_equals(dynamic.sharedSources, null);
  stop.abort();
}, "Hidden closure resources and dynamic inner sources do not automatically declare ancestry");

test(() => {
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  const a = new AbortController();
  const b = new AbortController();
  assert_equals(source.activeSubscribers, 0);
  source.subscribe({}, {signal: a.signal});
  source.map(v => v).subscribe({}, {signal: b.signal});
  assert_equals(source.activeSubscribers, 2);
  a.abort();
  assert_equals(source.activeSubscribers, 1);
  sink.complete();
  assert_equals(source.activeSubscribers, 0);
}, "activeSubscribers includes internal operator observations and updates synchronously");

test(() => {
  let sink;
  const value = {};
  const source = new SharedObservable({maxReplayValues: "2", producer(s) { sink = s; }});
  assert_equals(source.maxReplayValues, 2);
  assert_array_equals(source.replayValues, []);
  source.subscribe();
  sink.next(value);
  const snapshot = source.replayValues;
  assert_true(Object.isFrozen(snapshot));
  assert_equals(snapshot[0], value);
  assert_false(Object.isFrozen(value));
  sink.next(2);
  sink.next(3);
  assert_array_equals(snapshot, [value]);
  assert_array_equals(source.replayValues, [2, 3]);
  sink.complete();
  assert_array_equals(source.replayValues, []);
  assert_array_equals(snapshot, [value]);
}, "replayValues is a frozen, shallow snapshot, independent of later eviction and reset");

test(() => {
  const source = new SharedObservable({maxReplayValues: 1, producer(s) {
    s.next(42);
    s.complete({close: true});
  }});
  source.subscribe();
  const counts = [];
  source.subscribe({
    next() {
      counts.push(source.activeSubscribers);
      source.subscribe({
        next: () => counts.push(source.activeSubscribers),
        complete: () => counts.push(source.activeSubscribers),
      });
    },
    complete: () => counts.push(source.activeSubscribers),
  });
  assert_array_equals(counts, [1, 2, 1, 0]);
  assert_equals(source.activeSubscribers, 0);
}, "activeSubscribers includes nested closed-replay observations until their terminal delivery");
