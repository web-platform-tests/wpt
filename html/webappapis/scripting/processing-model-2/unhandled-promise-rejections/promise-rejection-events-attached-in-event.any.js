// https://html.spec.whatwg.org/#unhandled-promise-rejections

'use strict';
setup({
  allow_uncaught_exception: true
});
async_test(function(t) {
  var e = new Error('e');
  var p = Promise.reject(e);

  globalThis.onunhandledrejection = function(evt) {
    t.step(function() {
      assert_equals(evt.promise, p);
      assert_equals(evt.reason, e);
    });
    var unreached = t.unreached_func('promise should not be fulfilled');
    p.then(unreached, function(reason) {
      t.step(function() {
        assert_equals(reason, e);
      });
      t.step_timeout(function() { t.done(); }, 10);
    });
  };

  globalThis.onrejectionhandled = t.unreached_func('rejectionhandled event should not be invoked');
}, 'Attaching a handler in unhandledrejection should not trigger rejectionhandled.');
