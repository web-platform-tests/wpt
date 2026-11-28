// META: title=Observable sharing proposal: sharing configuration and boundaries
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221
// META: spec=https://github.com/WICG/observable/pull/222

test(() => {
  assert_implements(self.Observable, "Observable must be implemented");
  assert_implements(self.SharedObservable, "SharedObservable must be implemented");
  assert_implements(Observable.prototype.share, "Observable.share() must be implemented");
}, "The Observable sharing APIs are exposed");

test(t => {
  let starts = 0;
  let cleanups = 0;
  const source = new Observable(s => {
    ++starts;
    s.addTeardown(() => ++cleanups);
  });
  const shared = source.share();
  assert_true(shared instanceof SharedObservable);
  const a = new AbortController();
  const b = new AbortController();
  const c = new AbortController();
  t.add_cleanup(() => { a.abort(); b.abort(); c.abort(); });
  assert_equals(starts, 0);
  shared.subscribe({}, {signal: a.signal});
  shared.subscribe({}, {signal: b.signal});
  assert_equals(starts, 1);
  a.abort();
  assert_equals(cleanups, 0);
  b.abort();
  assert_equals(cleanups, 1);
  shared.subscribe({}, {signal: c.signal});
  assert_equals(starts, 2);
  c.abort();
}, "share(): one lazy execution remains until its last observer cancels, then can restart");

test(t => {
  let starts = 0;
  const source = new Observable(s => { ++starts; });
  const a = source.share();
  const b = source.share();
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  assert_not_equals(a, b);
  a.subscribe({}, {signal: stop.signal});
  b.subscribe({}, {signal: stop.signal});
  assert_equals(starts, 2);
  stop.abort();
}, "Separate share() calls on ordinary input establish independent boundaries");

// #222 uses an `any` dictionary member followed by ToNumber and custom range
// checks. An integer IDL member would truncate fractions before these checks.
for (const maxReplayValues of [-1, 0.5, Infinity, -Infinity, NaN, 2 ** 53]) {
  test(() => {
    assert_throws_js(RangeError, () => new SharedObservable({producer() {}, maxReplayValues}));
    const source = new Observable(() => {});
    assert_throws_js(RangeError, () => source.share({maxReplayValues}));
    const shared = source.share();
    assert_throws_js(RangeError, () => shared.share({maxReplayValues}));
  }, `Sharing configuration rejects replay capacity ${maxReplayValues}`);
}

for (const [label, maxReplayValues] of [["negative zero", -0], ["zero", 0],
                                      ["one", 1], ["maximum safe integer", 2 ** 53 - 1]]) {
  test(() => {
    let starts = 0;
    const producer = () => ++starts;
    const constructed = new SharedObservable({producer, maxReplayValues});
    const shared = new Observable(producer).share({maxReplayValues});
    assert_true(constructed instanceof SharedObservable);
    assert_true(shared instanceof SharedObservable);
    assert_equals(constructed.share({maxReplayValues}), constructed);
    assert_equals(shared.share({maxReplayValues}), shared);
    const changed = new SharedObservable(producer).share({maxReplayValues});
    assert_true(changed instanceof SharedObservable);
    assert_equals(changed.share({maxReplayValues}), changed);
    assert_equals(starts, 0);
  }, `Sharing configuration accepts ${label} without starting production`);
}

test(() => {
  const source = new SharedObservable({producer() {}, maxReplayValues: -0});
  assert_equals(source.share({maxReplayValues: 0}), source);
  const ordinary = new Observable(() => {}).share({maxReplayValues: 0});
  assert_equals(ordinary.share({maxReplayValues: -0}), ordinary);
}, "Positive and negative zero replay capacities preserve shared identity");

test(t => {
  let sink;
  const source = new Observable(s => { sink = s; });
  const shared = source.share({maxReplayValues: undefined});
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  shared.subscribe({}, {signal: stop.signal});
  sink.next(1);
  const values = [];
  shared.subscribe(value => values.push(value), {signal: stop.signal});
  assert_array_equals(values, [], "Undefined on ordinary input defaults to no replay");
  sink.next(2);
  assert_array_equals(values, [2]);
}, "share({maxReplayValues: undefined}) on ordinary input uses the default capacity of zero");

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
  const keys = ["maxReplayValues", "closeOnComplete", "closeOnError",
                "closeOnLastUnsubscribe", "keepAliveOnLastUnsubscribe"];
  const constructorReads = {};
  const shareReads = {};
  const constructorConfig = {producer(s) { ++starts; s.complete({close: true}); }};
  const shareConfig = {};
  for (const [config, reads] of [[constructorConfig, constructorReads], [shareConfig, shareReads]]) {
    for (const key of keys) {
      Object.defineProperty(config, key, {get() {
        reads[key] = (reads[key] || 0) + 1;
        return key === "maxReplayValues" ? 0 : false;
      }});
    }
  }
  const source = new SharedObservable(constructorConfig);
  for (const key of keys) assert_equals(constructorReads[key], 1, key);
  source.subscribe();
  assert_equals(source.share(shareConfig), source);
  for (const key of keys) {
    assert_equals(constructorReads[key], 1, `Constructor config is not reread: ${key}`);
    assert_equals(shareReads[key], 1, `Share config is read once: ${key}`);
  }
  source.subscribe();
  assert_equals(starts, 1);
}, "Configuration is read once per call, including an identity return after permanent closure");

test(() => {
  let producerReads = 0;
  let sharedSourcesReads = 0;
  const config = {
    get producer() { ++producerReads; throw new Error("Must not read producer"); },
    get sharedSources() { ++sharedSourcesReads; throw new Error("Must not read sharedSources"); },
  };
  const ordinary = new Observable(() => {});
  const shared = ordinary.share(config);
  assert_true(shared instanceof SharedObservable);
  assert_equals(shared.share(config), shared);
  const differentConfig = Object.create(config);
  differentConfig.maxReplayValues = 1;
  const wrapper = shared.share(differentConfig);
  assert_true(wrapper instanceof SharedObservable);
  assert_equals(producerReads, 0);
  assert_equals(sharedSourcesReads, 0);
}, "share() ignores constructor-only members on ordinary input, identity returns, and wrappers");

test(t => {
  let starts = 0;
  const source = new SharedObservable(s => { ++starts; });
  const wrapper = source.share({maxReplayValues: 3});
  assert_not_equals(wrapper, source);
  assert_true(wrapper instanceof SharedObservable);
  assert_equals(starts, 0, "Creating a wrapper on an idle source does not subscribe");
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  wrapper.subscribe({}, {signal: stop.signal});
  assert_equals(starts, 1);
}, "Different sharing settings create a lazy SharedObservable wrapper on an idle source");

test(t => {
  let sink;
  let starts = 0;
  const source = new SharedObservable({
    maxReplayValues: 1,
    producer(s) { sink = s; ++starts; },
  });
  const stop = new AbortController();
  t.add_cleanup(() => stop.abort());
  source.subscribe({}, {signal: stop.signal});
  sink.next(1);
  sink.next(2);
  const wrapper = source.share({maxReplayValues: 3});
  const values = [];
  assert_equals(starts, 1);
  wrapper.subscribe(value => values.push(value), {signal: stop.signal});
  assert_array_equals(values, [2], "A wrapper cannot recover discarded history");
  sink.next(3);
  assert_array_equals(values, [2, 3]);
  assert_equals(starts, 1, "The wrapper observes the original, not a copy of its producer");
  sink.complete();
}, "A forwarding wrapper cannot recover discarded upstream history or copy the producer");

for (const kind of ["complete", "error"]) {
  test(() => {
    const reason = {};
    let starts = 0;
    const source = new SharedObservable({
      maxReplayValues: 2,
      producer(s) {
        ++starts;
        s.next(41);
        s.next(42);
        if (kind === "complete") s.complete({close: true});
        else s.error(reason, {close: true});
      },
    });
    const wrapper = source.share({maxReplayValues: 1});
    const log = [];
    const observer = {
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    };
    wrapper.subscribe(observer);
    wrapper.subscribe(observer);
    assert_equals(starts, 1);
    assert_array_equals(log, [41, 42, kind === "complete" ? "complete" : reason,
                             41, 42, kind === "complete" ? "complete" : reason]);
  }, `A wrapper cannot reopen a source closed by ${kind}, and chooses its own terminal policy`);

  test(() => {
    const reason = {};
    let starts = 0;
    const source = new SharedObservable({
      maxReplayValues: 2,
      [kind === "complete" ? "closeOnComplete" : "closeOnError"]: true,
      producer(s) {
        ++starts;
        s.next(41);
        s.next(42);
        if (kind === "complete") s.complete();
        else s.error(reason);
      },
    });
    const wrapper = source.share({maxReplayValues: 1});
    const log = [];
    const observer = {
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    };
    wrapper.subscribe(observer);
    wrapper.subscribe(observer);
    const terminal = kind === "complete" ? "complete" : reason;
    assert_array_equals(log, [41, 42, terminal, 42, terminal],
      "The second observation replays only the wrapper's retained value");
    assert_equals(starts, 1);
  }, `A new wrapper inherits the source's close-on-${kind} setting behaviorally`);

  test(() => {
    const reason = {};
    let starts = 0;
    const source = new SharedObservable({
      maxReplayValues: 2,
      producer(s) {
        ++starts;
        s.next(41);
        s.next(42);
        if (kind === "complete") s.complete({close: true});
        else s.error(reason, {close: true});
      },
    });
    source.subscribe({error() {}});
    const wrapper = source.share({maxReplayValues: 1});
    assert_not_equals(wrapper, source);
    assert_true(wrapper instanceof SharedObservable);
    assert_equals(starts, 1);
    const log = [];
    wrapper.subscribe({
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    });
    log.push("returned");
    assert_array_equals(log, [41, 42, kind === "complete" ? "complete" : reason, "returned"]);
    assert_equals(starts, 1);
  }, `A new wrapper created after source ${kind} closure observes retained history without restarting`);
}

test(() => {
  let starts = 0;
  const source = new SharedObservable({
    maxReplayValues: 2,
    producer(s) { ++starts; s.next(1); s.next(2); s.next(3); s.complete(); },
  });
  const wrapper = source.share({closeOnComplete: true});
  const log = [];
  const observer = {next: value => log.push(value), complete: () => log.push("complete")};
  wrapper.subscribe(observer);
  wrapper.subscribe(observer);
  assert_array_equals(log, [1, 2, 3, "complete", 2, 3, "complete"]);
  assert_equals(starts, 1);
}, "A new wrapper inherits replay capacity while changing its completion policy");

test(t => {
  let sink;
  const source = new SharedObservable({
    closeOnLastUnsubscribe: true,
    producer(s) { sink = s; },
  });
  const external = new AbortController();
  const consumer = new AbortController();
  t.add_cleanup(() => { external.abort(); consumer.abort(); });
  source.subscribe({}, {signal: external.signal});
  const wrapper = source.share({maxReplayValues: 1});
  wrapper.subscribe({}, {signal: consumer.signal});
  sink.next(1);
  consumer.abort();
  assert_true(sink.active, "The external source observation keeps the source running");
  const log = [];
  wrapper.subscribe({
    next: value => log.push(value), complete: () => log.push("complete"),
  }, {signal: external.signal});
  assert_array_equals(log, [1, "complete"]);
}, "A new wrapper inherits closeOnLastUnsubscribe and closes independently of its source");

test(t => {
  let sink;
  const source = new SharedObservable({
    keepAliveOnLastUnsubscribe: true,
    producer(s) { sink = s; },
  });
  const stop = new AbortController();
  t.add_cleanup(() => { stop.abort(); if (sink) sink.complete(); });
  const wrapper = source.share({maxReplayValues: 1});
  wrapper.subscribe({}, {signal: stop.signal});
  sink.next(1);
  stop.abort();
  sink.next(2);
  const values = [];
  wrapper.subscribe(value => values.push(value));
  assert_array_equals(values, [2], "The wrapper kept observing and retaining values with no consumers");
}, "A new wrapper inherits keepAliveOnLastUnsubscribe behaviorally");

for (const externalObserver of [false, true]) {
  test(t => {
    const sinks = [];
    let cleanups = 0;
    const source = new SharedObservable(s => {
      sinks.push(s);
      s.addTeardown(() => ++cleanups);
    });
    const external = new AbortController();
    const a = new AbortController();
    const b = new AbortController();
    const later = new AbortController();
    t.add_cleanup(() => { external.abort(); a.abort(); b.abort(); later.abort(); });
    const upstreamValues = [];
    if (externalObserver) {
      source.subscribe(value => upstreamValues.push(value), {signal: external.signal});
    }
    const wrapper = source.share({maxReplayValues: 1});
    const aValues = [];
    const bValues = [];
    wrapper.subscribe(value => aValues.push(value), {signal: a.signal});
    wrapper.subscribe(value => bValues.push(value), {signal: b.signal});
    assert_equals(sinks.length, 1);
    sinks[0].next(1);
    a.abort();
    assert_equals(cleanups, 0);
    sinks[0].next(2);
    assert_array_equals(aValues, [1]);
    assert_array_equals(bValues, [1, 2], "The other wrapper observer remains attached");
    b.abort();
    assert_equals(cleanups, externalObserver ? 0 : 1);
    assert_equals(sinks[0].active, externalObserver);
    sinks[0].next(3);
    if (externalObserver) assert_array_equals(upstreamValues, [1, 2, 3]);
    external.abort();
    assert_equals(cleanups, 1, "No wrapper observation remains attached upstream");
    source.subscribe({}, {signal: later.signal});
    assert_equals(sinks.length, 2);
  }, `Last wrapper cancellation releases upstream with ${externalObserver ? "another source observer" : "no other source observers"}`);
}

for (const terminal of ["complete", "error"]) {
  test(t => {
    const sinks = [];
    let cleanups = 0;
    const reason = {};
    const source = new SharedObservable(s => {
      sinks.push(s);
      s.addTeardown(() => ++cleanups);
    });
    const stop = new AbortController();
    t.add_cleanup(() => { stop.abort(); for (const sink of sinks) sink.complete(); });
    const wrapper = source.share({maxReplayValues: 1, keepAliveOnLastUnsubscribe: true});
    wrapper.subscribe({}, {signal: stop.signal});
    stop.abort();
    assert_equals(cleanups, 0, "The wrapper still owns an upstream observation");
    assert_true(sinks[0].active);
    sinks[0].next(42);
    const log = [];
    wrapper.subscribe({
      next: value => log.push(value),
      complete: () => log.push("complete"),
      error: error => log.push(error),
    });
    assert_array_equals(log, [42]);
    assert_equals(sinks.length, 1);
    if (terminal === "complete") sinks[0].complete();
    else sinks[0].error(reason);
    assert_equals(cleanups, 1, "The source can still terminate its execution");
    assert_array_equals(log, [42, terminal === "complete" ? "complete" : reason]);
    wrapper.subscribe();
    assert_equals(sinks.length, 2, "Default terminal reset permits a later execution");
  }, `A keep-alive wrapper keeps a default source observed but cannot prevent its ${terminal}`);
}
