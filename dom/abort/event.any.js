test(t => {
  const c = new AbortController(),
        s = c.signal;
  let state = "begin";

  assert_false(s.aborted);

  s.addEventListener("abort",
    t.step_func(e => {
      assert_equals(state, "begin");
      state = "aborted";
    })
  );
  c.abort();

  assert_equals(state, "aborted");
  assert_true(s.aborted);

  c.abort();
}, "AbortController abort() should fire event synchronously");

test(t => {
  const controller = new AbortController();
  const signal = controller.signal;
  assert_equals(controller.signal, signal,
                "value of controller.signal should not have changed");
  controller.abort();
  assert_equals(controller.signal, signal,
                "value of controller.signal should still not have changed");
}, "controller.signal should always return the same object");

test(t => {
  const controller = new AbortController();
  const signal = controller.signal;
  let eventCount = 0;
  signal.onabort = () => {
    ++eventCount;
  };
  controller.abort();
  assert_true(signal.aborted);
  assert_equals(eventCount, 1, "event handler should have been called once");
  controller.abort();
  assert_true(signal.aborted);
  assert_equals(eventCount, 1,
                "event handler should not have been called again");
}, "controller.abort() should do nothing the second time it is called");

test(t => {
  const controller = new AbortController();
  controller.abort();
  controller.signal.onabort =
      t.unreached_func("event handler should not be called");
}, "event handler should not be called if added after controller.abort()");

test(t => {
  const controller = new AbortController();
  const signal = controller.signal;
  signal.onabort = t.step_func(e => {
    assert_equals(e.type, "abort", "event type should be abort");
    assert_equals(e.target, signal, "event target should be signal");
    assert_false(e.bubbles, "event should not bubble");
    assert_true(e.isTrusted, "event should be trusted");
  });
  controller.abort();
}, "the abort event should have the right properties");

test(t => {
  const signal = AbortSignal.abort();
  assert_true(signal.aborted);
}, "the AbortSignal.abort() static returns an already aborted signal");

test(t => {
  const acSignalGet = Object.getOwnPropertyDescriptor(AbortController.prototype, 'signal').get;
  const acAbort = AbortController.prototype.abort;

  const badAbortControllers = [null, undefined, 0, NaN, true, 'AbortController', Object.create(AbortController.prototype)];
  for (const badController of badAbortControllers) {
    assert_throws_js(TypeError, acSignalGet.bind(badController), 'controller.signal should throw');
    assert_throws_js(TypeError, acAbort.bind(badController), 'controller.abort() should throw');
  }
}, "AbortController should perform brand checks");

test(t => {
  const signalAbortedGet = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get;

  const badAbortSignals = [null, undefined, 0, NaN, true, 'AbortSignal', Object.create(AbortSignal.prototype)];
  for (const badSignal of badAbortSignals) {
    assert_throws_js(TypeError, signalAbortedGet.bind(badSignal), 'signal.aborted should throw');
  }
}, "AbortSignal should perform brand checks");

done();
