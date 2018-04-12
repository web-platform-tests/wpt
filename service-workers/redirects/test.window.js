// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(t => {
  return service_worker_unregister_and_register(t, "test.window.js-serviceworker.js", "./").then(() => {
    return with_iframe("test.window.js-redirect.py");
  }).then(frame => {
    assert_equals(frame.contentDocument.body.textContent, "stage 1 completed\n");
    frame.remove();
    return with_iframe("x/");
  }).then(frame => {
    assert_equals(frame.contentDocument.body.textContent, "YAY!\n");
    frame.remove();
  });
});
