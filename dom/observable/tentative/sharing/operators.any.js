// META: title=Observable sharing proposal: per-observation composition and teardown
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const method of ["map", "filter", "take", "drop", "takeUntil", "flatMap",
                      "switchMap", "inspect", "catch", "finally"]) {
  test(() => {
    let sink;
    let starts = 0;
    let callbacks = 0;
    const source = new SharedObservable(s => { sink = s; ++starts; });
    const callback = value => { ++callbacks; return [value]; };
    const args = {
      map: [callback], filter: [callback], take: [2], drop: [1],
      takeUntil: [new Observable(() => {})], flatMap: [callback],
      switchMap: [callback], inspect: [callback], catch: [callback], finally: [callback],
    };
    const result = source[method](...args[method]);
    assert_equals(starts, 0);
    assert_equals(callbacks, 0);
    // Observable.from preserves both brands without deciding their prototype hierarchy.
    assert_equals(Observable.from(result), result);
    assert_not_equals(result.share(), result, "Composition returns an ordinary Observable");
    result.subscribe();
    result.subscribe();
    assert_equals(starts, 1, "The ordinary results still observe a shared upstream");
    sink.complete();
  }, `${method} constructs a lazy ordinary result from shared input`);
}

test(() => {
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  const perObserver = source.take(3);
  const a = [];
  const b = [];
  perObserver.subscribe({next: v => a.push(v), complete: () => a.push("complete")});
  sink.next(1);
  perObserver.subscribe({next: v => b.push(v), complete: () => b.push("complete")});
  sink.next(2);
  sink.next(3);
  sink.next(4);
  assert_array_equals(a, [1, 2, 3, "complete"]);
  assert_array_equals(b, [2, 3, 4, "complete"]);
}, "take(): late observers get independent allowances on a shared source");

test(() => {
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  const session = source.take(3).share({closeOnComplete: true});
  const a = [];
  const b = [];
  session.subscribe({next: v => a.push(v), complete: () => a.push("complete")});
  sink.next(1);
  session.subscribe({next: v => b.push(v), complete: () => b.push("complete")});
  sink.next(2);
  sink.next(3);
  sink.next(4);
  assert_array_equals(a, [1, 2, 3, "complete"]);
  assert_array_equals(b, [2, 3, "complete"]);
}, "Sharing after take() deliberately shares its allowance");

for (const method of ["map", "filter"]) {
  test(() => {
    let sink;
    const source = new SharedObservable(s => { sink = s; });
    const seen = [];
    const result = source[method]((value, index) => { seen.push(value, index); return true; });
    result.subscribe();
    sink.next("first");
    result.subscribe();
    sink.next("second");
    assert_array_equals(seen, ["first", 0, "second", 1, "second", 0]);
    sink.complete();
  }, `${method} callback indices are per observation`);
}

test(() => {
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  const result = source.drop(1);
  const a = [];
  const b = [];
  result.subscribe(v => a.push(v));
  sink.next(1);
  result.subscribe(v => b.push(v));
  sink.next(2);
  sink.next(3);
  assert_array_equals(a, [2, 3]);
  assert_array_equals(b, [3]);
  sink.complete();
}, "drop() counters are per observation");

test(() => {
  const log = [];
  new Observable(s => {
    s.addTeardown(() => log.push("cleanup"));
    s.next(1);
    s.next(2);
  }).take(1).subscribe({next: v => log.push(v), complete: () => log.push("complete")});
  assert_array_equals(log, ["cleanup", 1, "complete"]);
}, "take() detaches and runs registered upstream cleanup before its final value");

test(() => {
  let starts = 0;
  const log = [];
  new Observable(() => ++starts).take(0).subscribe({complete: () => log.push("complete")});
  assert_equals(starts, 0);
  assert_array_equals(log, ["complete"]);
}, "take(0) completes without starting the producer");

test(() => {
  let sink;
  const source = new SharedObservable(s => { sink = s; });
  const all = [];
  const taken = [];
  source.subscribe(v => all.push(v));
  source.take(1).subscribe(value => { taken.push(value); sink.next(2); });
  sink.next(1);
  assert_array_equals(taken, [1]);
  assert_array_equals(all, [1, 2]);
  assert_true(sink.active);
  sink.complete();
}, "take() stops reentrant extra values without stopping another shared observer");

test(() => {
  const stop = new AbortController();
  const log = [];
  new Observable(s => {
    s.addTeardown(() => stop.abort());
    s.next(1);
  }).take(1).subscribe({next: v => log.push(v), complete: () => log.push("complete")},
                      {signal: stop.signal});
  assert_array_equals(log, []);
}, "Cancellation from take() upstream teardown suppresses its pending final delivery");

for (const shareAfter of [false, true]) {
  test(() => {
    let sink;
    let effects = 0;
    const raw = new Observable(s => { sink = s; });
    const source = shareAfter ? raw.inspect(() => ++effects).share() :
      raw.share().inspect(() => ++effects);
    source.subscribe();
    source.subscribe();
    sink.next(1);
    assert_equals(effects, shareAfter ? 1 : 2);
    sink.complete();
  }, `Side effects ${shareAfter ? "before" : "after"} the shared boundary run ${shareAfter ? "once" : "per observer"}`);
}

test(() => {
  const log = [];
  let attempts = 0;
  const source = new SharedObservable(s => {
    const attempt = ++attempts;
    s.addTeardown(() => log.push(`cleanup ${attempt}`));
    if (attempt === 1) s.error("retry");
    else { s.next(42); s.complete(); }
  });
  source.catch(() => {
    log.push("recover");
    return source;
  }).subscribe({next: v => log.push(v), complete: () => log.push("complete")});
  assert_equals(attempts, 2);
  assert_array_equals(log, ["cleanup 1", "recover", 42, "cleanup 2", "complete"]);
}, "catch() can resubscribe to a reset shared source after failed-attempt cleanup");

test(t => {
  const log = [];
  let sink;
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  new Observable(s => { sink = s; }).switchMap(value => {
    log.push(`map ${value}`);
    return new Observable(s => {
      log.push(`start ${value}`);
      s.addTeardown(() => log.push(`cleanup ${value}`));
    });
  }).subscribe({}, {signal: stop.signal});
  sink.next(1);
  sink.next(2);
  assert_array_equals(log, ["map 1", "start 1", "cleanup 1", "map 2", "start 2"]);
  sink.complete();
}, "switchMap() cleans up obsolete work before invoking the replacement mapper");
