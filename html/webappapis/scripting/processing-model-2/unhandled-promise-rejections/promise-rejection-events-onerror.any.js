// META: global=dedicatedworker,shadowrealm

// https://html.spec.whatwg.org/#runtime-script-errors
// https://html.spec.whatwg.org/#unhandled-promise-rejections

'use strict';

setup({
  allow_uncaught_exception: true
});

async_test(function(t) {
  var e = new Error('e');
  var e2 = new Error('e2');

  globalThis.onerror = function (msg, url, line, col, error) {
    t.step(function() {
      assert_true(msg.includes('e2'));
      assert_equals(error, e2);
    });
    t.done();
  };

  globalThis.onrejectionhandled = function() {
    // This should cause onerror
    throw e2;
  };

  var p = Promise.reject(e);
  t.step_timeout(function() {
    // This will cause onrejectionhandled
    p.catch(function() {});
  });
}, 'Throwing inside an unhandledrejection handler invokes the error handler.');
