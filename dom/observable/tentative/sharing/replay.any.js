// META: title=Observable sharing proposal: synchronous replay
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const capacity of [0, 1, 2, 4]) {
  test(() => {
    let sink;
    const source = new SharedObservable({maxReplayValues: capacity, producer(s) { sink = s; }});
    source.subscribe();
    for (const value of [1, 2, 3]) sink.next(value);
    const log = [];
    source.subscribe(value => log.push(value));
    log.push("returned");
    assert_array_equals(log, [...(capacity ? [1, 2, 3].slice(-capacity) : []), "returned"]);
    sink.complete();
  }, `Replay capacity ${capacity} retains the newest values and replays synchronously oldest first`);
}

for (const capacity of [0, 1]) {
  test(() => {
    const log = [];
    const source = new SharedObservable({
      maxReplayValues: capacity,
      producer(s) { s.next(7); s.complete({close: true}); },
    });
    source.subscribe({
      next(value) {
        log.push(`A:${value}`);
        source.subscribe({
          next: inner => log.push(`B:${inner}`),
          complete: () => log.push("B complete"),
        });
      },
      complete: () => log.push("A complete"),
    });
    assert_array_equals(log, capacity ?
      ["A:7", "B:7", "A complete", "B complete"] :
      ["A:7", "A complete", "B complete"]);
  }, `Joining during next with replay capacity ${capacity} never duplicates the in-progress value`);
}

for (const state of ["running", "completed", "errored"]) {
  test(() => {
    let sink;
    const reason = {};
    const source = new SharedObservable({
      maxReplayValues: 3,
      producer(s) { sink = s; s.next(1); s.next(2); s.next(3); },
    });
    source.subscribe({error() {}});
    if (state === "completed") sink.complete({close: true});
    if (state === "errored") sink.error(reason, {close: true});
    const stop = new AbortController();
    const log = [];
    source.subscribe({
      next(value) { log.push(value); stop.abort(); },
      complete: () => log.push("complete"),
      error: error => log.push(error),
    }, {signal: stop.signal});
    assert_array_equals(log, [1]);
    sink.complete();
  }, `Cancellation during ${state} replay suppresses remaining values and terminal notification`);
}

for (const kind of ["complete", "error"]) {
  test(() => {
    let starts = 0;
    const reason = {};
    const source = new SharedObservable({producer(s) {
      ++starts;
      if (kind === "complete") s.complete({close: true});
      else s.error(reason, {close: true});
    }});
    source.subscribe({error() {}});
    const log = [];
    source.subscribe({
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    });
    log.push("returned");
    assert_array_equals(log, [kind === "complete" ? "complete" : reason, "returned"]);
    const aborted = [];
    source.subscribe({
      next: value => aborted.push(value),
      complete: () => aborted.push("complete"),
      error: error => aborted.push(error),
    }, {signal: AbortSignal.abort()});
    assert_array_equals(aborted, []);
    assert_equals(starts, 1);
  }, `Closed ${kind} without retained values is synchronous; an already-aborted observation is inert`);
}

for (const kind of ["complete", "error", "cancel"]) {
  test(() => {
    const sinks = [];
    const source = new SharedObservable({maxReplayValues: 2, producer(s) { sinks.push(s); }});
    const stop = new AbortController();
    source.subscribe({error() {}}, {signal: stop.signal});
    sinks[0].next(1);
    if (kind === "complete") sinks[0].complete();
    if (kind === "error") sinks[0].error("reason");
    if (kind === "cancel") stop.abort();
    const log = [];
    source.subscribe(value => log.push(value));
    assert_array_equals(log, [], "A new execution must not replay the old execution's history");
    sinks[1].next(2);
    assert_array_equals(log, [2]);
    sinks[1].complete();
  }, `Default ${kind} reset clears retained history before a new execution`);
}
