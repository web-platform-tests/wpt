"use strict";
importScripts("/resources/testharness.js");

setup({ allow_uncaught_exception: true });

promise_test(t => {
  self.onerror = t.step_func((...args) => {
    assert_greater_than(args.length, 1);
    return true;
  });

  const eventWatcher = new EventWatcher(t, self, "error");
  const promise = eventWatcher.wait_for("error").then(e => {
    assert_equals(e.defaultPrevented, true);
  });

  self.dispatchEvent(new ErrorEvent("error", { cancelable: true }));

  return promise;
}, "error event is weird (return true cancels; many args) on WorkerGlobalScope, with a synthetic ErrorEvent");

done();
