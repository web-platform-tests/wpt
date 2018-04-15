// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  const reg = await service_worker_unregister_and_register(t, "opaque-redirect-serviceworker.js", "./");
  t.add_cleanup(async () => await reg.unregister());
  await wait_for_state(t, reg.installing, 'activated');
  const frame = await with_iframe("resources/opaque-redirect.py");
  assert_equals(frame.contentDocument.body.textContent, "stage 1 completed\n");
  frame.remove();
  const frame2 = await with_iframe("resources/x/");
  assert_equals(frame2.contentDocument.body.textContent, "YAY!\n");
  frame2.remove();
}, "Passing an (opaque) redirect with a relative URL in its Location header to a second navigation with a different base URL");
