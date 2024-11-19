// META: title=Microtask checkpoint after ShadowRealm onerror events
// META: global=shadowrealm

// Adapted from first part of ./resources/checkpoint-after-error-event.js.

setup({allow_uncaught_exception: true});

var log = [];

addEventListener('error', () => {
  log.push('handler 1');
  Promise.resolve().then(() => log.push('handler 1 promise'));
});
addEventListener('error', () => {
  log.push('handler 2');
  Promise.resolve().then(() => log.push('handler 2 promise'));
});

async_test(t => {
  t.step_timeout(() => {
      assert_array_equals(log, [
          'handler 1',
          'handler 2',
          'handler 1 promise',
          'handler 2 promise'
        ]);
      t.done();
    },
    0);
}, "Promise resolved during #report-the-error");

queueMicrotask(() => thisFunctionDoesNotExist());
