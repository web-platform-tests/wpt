// META: global=window,worker

test(() => {
  // Use onfetch as service worker detector
  const assert = "onfetch" in globalThis ? assert_equals : assert_not_equals;
  assert(globalThis.Worker, undefined);
}, "Worker exposure")

test(() => {
  const assert = globalThis.GLOBAL.isWindow() ? assert_not_equals : assert_equals;
  assert(globalThis.SharedWorker, undefined);
}, "SharedWorker exposure")

