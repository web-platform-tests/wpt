function onUnhandledSucceed(t, expectedReason, expectedPromiseGetter) {
  var l = function(ev) {
    if (ev.promise === expectedPromiseGetter()) {
      t.step(function() {
        assert_equals(ev.reason, expectedReason);
        assert_equals(ev.promise, expectedPromiseGetter());
      });
      t.done();
    }
  };
  addEventListener('unhandledrejection', l);
  ensureCleanup(t, l);
}
globalThis.onUnhandledSucceed = onUnhandledSucceed;

function onUnhandledFail(t, expectedPromiseGetter) {
  var unhandled = function(evt) {
    if (evt.promise === expectedPromiseGetter()) {
      t.step(function() {
        assert_unreached('unhandledrejection event is not supposed to be triggered');
      });
    }
  };
  var handled = function(evt) {
    if (evt.promise === expectedPromiseGetter()) {
      t.step(function() {
        assert_unreached('rejectionhandled event is not supposed to be triggered');
      });
    }
  };
  addEventListener('unhandledrejection', unhandled);
  addEventListener('rejectionhandled', handled);
  ensureCleanup(t, unhandled, handled);
  t.step_timeout(function() {
    t.done();
  }, 10);
}
globalThis.onUnhandledFail = onUnhandledFail;

function ensureCleanup(t, unhandled, handled) {
  t.add_cleanup(function() {
    if (unhandled)
      removeEventListener('unhandledrejection', unhandled);
    if (handled)
      removeEventListener('rejectionhandled', handled);
  });
}
globalThis.ensureCleanup = ensureCleanup;
