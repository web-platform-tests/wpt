// META: title=initialize() resolves with undefined

/*
 * When `initialize(length)` is called successfully, it must asynchronously resolve the returned Promise with `undefined`.
 */

promise_test(async t => {
  const result = await window.crashReport.initialize(1024);
  assert_equals(result, undefined);
}, "initialize() resolves with undefined");