promise_test(() => {
  return fetch("resources/content-types.json").then(res => res.json()).then(runTests);
}, "Loading JSON…");

function runTests(tests) {
  tests.forEach(testUnit => {
    runTest(testUnit, false);
    runTest(testUnit, true);
  });
}

function runTest(testUnit, singleHeader) {
  // Note: window.js is always UTF-8
  const encoding = testUnit.encoding !== null ? testUnit.encoding : "UTF-8",
        desc = "Response Content-Type header: " + testUnit.input.join(" ") + " (" + (singleHeader ? "combined value" : "separate headers") + ")";
  async_test(t => {
    const frame = document.body.appendChild(document.createElement("iframe"));
    t.add_cleanup(() => frame.remove());
    // Edge does not support URLSearchParams
    let url = "resources/content-type.py?"
    if (singleHeader) {
      url += "single_header&"
    }
    testUnit.input.forEach(val => {
      url += "value=" + val + "&";
    });
    frame.src = url;
    frame.onload = t.step_func_done(() => {
      // Edge requires toUpperCase()
      assert_equals(frame.contentDocument.characterSet.toUpperCase(), encoding);
      assert_equals(frame.contentDocument.contentType, testUnit.documentContentType);
    });
  }, desc);
}
