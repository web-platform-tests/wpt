// META: script=../service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  const reg = await service_worker_unregister_and_register(t, "resources/navigate-fragment-serviceworker.js", "resources/");
  await wait_for_state(t, reg.installing, 'activated');

  // Changing this list requires corresponding changes in
  // resources/navigate-fragment-serviceworker.js
  [
    { input: "?1#test", output: "?1#test", subtitle: "request determines URL (control)" },
    { input: "?2#test", output: "#there", subtitle: "redirect fragment trumps request fragment" },
    { input: "?3#test", output: "#test", subtitle: "request fragment trumps null redirect fragment" },
    { input: "?4", output: "?4", subtitle: "request determines URL, including fragment" }
  ].forEach(({ input, output, subtitle }) => {

    promise_test(async t => {
      const iframe = await with_iframe(`resources/dummy.html${input}`);
      //t.add_cleanup(() => iframe.remove());
      assert_equals(iframe.contentWindow.location.href, `${new URL("resources/dummy.html", location).href}${output}`);
    }, `Navigate and fragments: ${subtitle}`);
  });

  // HOW?! t.add_cleanup(async () => await reg.unregister());
}, "Setup");
