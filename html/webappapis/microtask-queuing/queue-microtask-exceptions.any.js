"use strict";

setup({
  allow_uncaught_exception: true
});

async_test(t => {
  const error = new Error("boo");
  self.addEventListener("error", ev => {
    assert_equals(ev.error, error);
    t.done();
  });

  queueMicrotask(() => { throw error; });
}, "It rethrows exceptions");
