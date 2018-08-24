// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  const reg = await service_worker_unregister_and_register(t, "resources/fragment-serviceworker.js", "resources/");
  t.add_cleanup(async () => await reg.unregister());
  await wait_for_state(t, reg.installing, 'activated');
  const frame = await with_iframe("resources/dummy.html");

  // Changing this list requires corresponding changes in resources/fragment-serviceworker.js. Note
  // that expected here is intentionally not output there in some cases.
  [
    { "input": "test", "expected": "test.txt#success", "subtitle": "response retains fragment" },
    { "input": "test#hi", "expected": "test.txt#hi", "subtitle": "response gains request fragment" },
    { "input": "test#bye", "expected": "test.txt#hi", "subtitle": "response wins in case of fragment conflict" }
  ].forEach(val => {
    promise_test(async t => {
      const response = await frame.contentWindow.fetch("resources/" + val.input);
      assert_equals(response.url, new URL("resources/" + val.expected, location).href);
    }, "Forward response fragments: " + val.input);
  });
}, "Forward response fragments: setup");
