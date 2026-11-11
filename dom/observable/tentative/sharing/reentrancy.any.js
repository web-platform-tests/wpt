// META: title=Observable sharing proposal: reentrant delivery and teardown
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const trigger of [1, 2]) {
  test(() => {
    let sink;
    const source = new SharedObservable({maxReplayValues: 2, producer(s) { sink = s; }});
    source.subscribe(value => { if (value === 3) sink.next(4); });
    sink.next(1);
    sink.next(2);
    const log = [];
    source.subscribe(value => {
      log.push(value);
      if (value === trigger) sink.next(3);
    });
    assert_array_equals(log, trigger === 1 ? [1, 4, 3, 2] : [1, 2, 4, 3]);
    sink.complete();
  }, `Nested live delivery during replayed ${trigger} interleaves with a fixed replay snapshot`);
}

for (const kind of ["complete", "error"]) {
  test(() => {
    let sink;
    const reason = {};
    const source = new SharedObservable(s => { sink = s; });
    source.subscribe({
      next() {
        if (kind === "complete") sink.complete();
        else sink.error(reason);
      },
      error() {},
    });
    const log = [];
    source.subscribe({
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    });
    sink.next(1);
    assert_array_equals(log, [kind === "complete" ? "complete" : reason]);
  }, `Reentrant ${kind} suppresses a pending live value for later recipients`);

  test(() => {
    let sink;
    const reason = {};
    const source = new SharedObservable({
      maxReplayValues: 2,
      producer(s) { sink = s; s.next(1); s.next(2); },
    });
    source.subscribe({error() {}});
    const log = [];
    source.subscribe({
      next(value) {
        log.push(value);
        if (kind === "complete") sink.complete();
        else sink.error(reason);
      },
      complete: () => log.push("complete"),
      error: error => log.push(error),
    });
    assert_array_equals(log, [1, kind === "complete" ? "complete" : reason]);
  }, `Reentrant ${kind} during replay suppresses the remaining replay snapshot`);

  test(() => {
    let sink;
    const stop = new AbortController();
    const log = [];
    const source = new SharedObservable(s => {
      sink = s;
      s.addTeardown(() => log.push(s.active, s.signal.aborted, "cleanup"));
    });
    source.subscribe({[kind]() { log.push("A"); stop.abort(); }});
    source.subscribe({[kind]() { log.push("B"); }}, {signal: stop.signal});
    if (kind === "complete") sink.complete();
    else sink.error("reason");
    assert_array_equals(log, [false, true, "cleanup", "A"]);
  }, `${kind}: stopped state and cleanup precede callbacks, which can cancel later terminal recipients`);
}

test(() => {
  let sink;
  const stop = new AbortController();
  const source = new SharedObservable(s => { sink = s; });
  source.subscribe(() => stop.abort());
  const log = [];
  source.subscribe(value => log.push(value), {signal: stop.signal});
  sink.next(1);
  assert_array_equals(log, []);
  sink.complete();
}, "Cancellation during live delivery suppresses recipients already captured in its snapshot");

for (const trigger of ["cancel", "complete"]) {
  test(() => {
    const sinks = [];
    const values = [];
    const source = new SharedObservable(s => {
      sinks.push(s);
      if (sinks.length === 1) {
        s.addTeardown(() => source.subscribe(value => values.push(value)));
      }
    });
    const stop = new AbortController();
    source.subscribe({}, {signal: stop.signal});
    if (trigger === "cancel") stop.abort();
    else sinks[0].complete();
    assert_equals(sinks.length, 2);
    sinks[0].next("stale");
    sinks[0].complete({close: true});
    assert_true(sinks[1].active);
    sinks[1].next("replacement");
    assert_array_equals(values, ["replacement"]);
    sinks[1].complete();
  }, `${trigger}: reset is committed before teardown can start a replacement execution`);
}

test(() => {
  const sinks = [];
  const stop = new AbortController();
  const values = [];
  const source = new SharedObservable(s => sinks.push(s));
  source.subscribe({}, {signal: stop.signal});
  let reads = 0;
  sinks[0].complete({get close() {
    ++reads;
    stop.abort();
    source.subscribe(value => values.push(value));
    return true;
  }});
  assert_equals(reads, 1);
  assert_equals(sinks.length, 2);
  assert_true(sinks[1].active);
  sinks[1].next(1);
  assert_array_equals(values, [1]);
  sinks[1].complete();
  source.subscribe();
  assert_equals(sinks.length, 3, "The old terminal call did not permanently close the owner");
  sinks[2].complete();
}, "complete(): execution eligibility is checked after converting a reentrant close getter");

test(() => {
  const sinks = [];
  const values = [];
  const oldConsumer = new AbortController();
  const source = new SharedObservable(s => sinks.push(s));
  source.subscribe({complete() {
    source.subscribe(value => values.push(value));
    oldConsumer.abort();
  }});
  source.subscribe({complete: () => values.push("old complete")}, {signal: oldConsumer.signal});
  sinks[0].complete();
  assert_true(sinks[1].active);
  sinks[1].next("new");
  assert_array_equals(values, ["new"]);
  sinks[1].complete();
}, "Canceling an old terminal recipient cannot detach a replacement execution's observer");

test(() => {
  let starts = 0;
  const log = [];
  const source = new SharedObservable({
    maxReplayValues: 1,
    producer(s) {
      ++starts;
      s.addTeardown(() => source.subscribe({
        next: value => log.push(value), complete: () => log.push("nested complete"),
      }));
      s.next(42);
      s.complete({close: true});
    },
  });
  source.subscribe({complete: () => log.push("original complete")});
  assert_equals(starts, 1);
  assert_array_equals(log, [42, "nested complete", "original complete"]);
}, "Permanent closure and retained history are visible to a subscription made during teardown");
