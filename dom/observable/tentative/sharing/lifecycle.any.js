// META: title=Observable sharing proposal: cancellation and terminal policies
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const kind of ["complete", "error"]) {
  for (const permanent of [false, true]) {
    for (const producerOverride of [false, true]) {
      test(() => {
        let starts = 0;
        const reason = {};
        const log = [];
        const source = new SharedObservable({
          maxReplayValues: 1,
          [kind === "complete" ? "closeOnComplete" : "closeOnError"]: permanent,
          producer(s) {
            ++starts;
            s.addTeardown(() => log.push("cleanup"));
            s.next(starts);
            if (kind === "complete") s.complete({close: producerOverride});
            else s.error(reason, {close: producerOverride});
          },
        });
        const terminal = kind === "complete" ? "complete" : reason;
        const observer = {
          next: value => log.push(value),
          complete: () => log.push("complete"),
          error: error => log.push(error),
        };
        source.subscribe(observer);
        assert_equals(starts, 1, "Reset does not automatically retry");
        source.subscribe(observer);
        if (permanent || producerOverride) {
          assert_equals(starts, 1);
          assert_array_equals(log, [1, "cleanup", terminal, 1, terminal]);
        } else {
          assert_equals(starts, 2);
          assert_array_equals(log, [1, "cleanup", terminal, 2, "cleanup", terminal]);
        }
      }, `${kind}: configured closure ${permanent}, producer close ${producerOverride}`);
    }
  }
}

for (const policy of ["reset", "closeOnLastUnsubscribe", "keepAliveOnLastUnsubscribe"]) {
  test(() => {
    const sinks = [];
    let cleanups = 0;
    const source = new SharedObservable({
      maxReplayValues: 2,
      ...(policy === "reset" ? {} : {[policy]: true}),
      producer(s) {
        sinks.push(s);
        s.addTeardown(() => ++cleanups);
      },
    });
    assert_equals(sinks.length, 0, "Zero observers at construction does not trigger a policy");
    const a = new AbortController();
    const b = new AbortController();
    source.subscribe({}, {signal: a.signal});
    source.subscribe({}, {signal: b.signal});
    sinks[0].next(1);
    a.abort();
    assert_equals(cleanups, 0);
    b.abort();
    assert_equals(cleanups, policy === "keepAliveOnLastUnsubscribe" ? 0 : 1);
    sinks[0].next(2);
    const log = [];
    source.subscribe({next: v => log.push(v), complete: () => log.push("complete")});
    assert_array_equals(log, policy === "reset" ? [] :
      policy === "closeOnLastUnsubscribe" ? [1, "complete"] : [1, 2]);
    assert_equals(sinks.length, policy === "reset" ? 2 : 1);
    for (const sink of sinks) sink.complete();
  }, `Last-observer cancellation follows ${policy}`);
}

for (const kind of ["complete", "error"]) {
  for (const permanent of [false, true]) {
    test(() => {
      const sinks = [];
      let cleanups = 0;
      const reason = {};
      const source = new SharedObservable({
        maxReplayValues: 1,
        keepAliveOnLastUnsubscribe: true,
        [kind === "complete" ? "closeOnComplete" : "closeOnError"]: permanent,
        producer(s) {
          sinks.push(s);
          s.addTeardown(() => ++cleanups);
        },
      });
      const stop = new AbortController();
      source.subscribe({}, {signal: stop.signal});
      stop.abort();
      sinks[0].next(1);
      if (kind === "complete") sinks[0].complete();
      else sinks[0].error(reason);
      assert_false(sinks[0].active);
      assert_equals(cleanups, 1);
      const log = [];
      source.subscribe({
        next: value => log.push(value),
        complete: () => log.push("complete"),
        error: error => log.push(error),
      });
      assert_array_equals(log, permanent ? [1, kind === "complete" ? "complete" : reason] : []);
      assert_equals(sinks.length, permanent ? 1 : 2);
      for (const sink of sinks) sink.complete();
    }, `Keep-alive with zero observers still ends on ${kind} with permanent policy ${permanent}`);
  }

  test(() => {
    let starts = 0;
    const source = new SharedObservable({
      closeOnLastUnsubscribe: true,
      producer(s) {
        ++starts;
        if (kind === "complete") s.complete();
        else s.error("reason");
      },
    });
    source.subscribe({error() {}});
    source.subscribe({error() {}});
    assert_equals(starts, 2);
  }, `${kind} does not invoke the last-unsubscribe closure policy`);
}

test(() => {
  let sink;
  const log = [];
  new SharedObservable(s => {
    sink = s;
    s.addTeardown(() => log.push("first"));
    s.addTeardown(() => log.push("second"));
  }).subscribe({complete: () => log.push("complete")});
  sink.complete();
  sink.addTeardown(() => log.push("late"));
  assert_array_equals(log, ["second", "first", "complete", "late"]);
}, "Shared cleanup is LIFO, precedes completion, and late teardown runs immediately");
