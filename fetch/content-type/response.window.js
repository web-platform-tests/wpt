promise_test(() => {
  return fetch("resources/content-types.json").then(res => res.json()).then(runTests);
}, "Loading JSON…");

function runTests(tests) {
  tests.forEach(testUnit => {
    const encoding = testUnit.encoding !== null ? testUnit.encoding : "UTF-8";
    async_test(t => {
      const frame = document.body.appendChild(document.createElement("iframe"));
      t.add_cleanup(() => frame.remove());
      const url = new URL("resources/content-type.py", self.location);
      url.searchParams.append("single_header", "");
      testUnit.input.forEach(val => {
        url.searchParams.append("value", val);
      });
      frame.src = url;
      frame.onload = t.step_func_done(() => {
        assert_equals(frame.contentDocument.characterSet, encoding);
        assert_equals(frame.contentDocument.contentType, testUnit.documentContentType);
      });
    }, "Response Content-Type header test: " + testUnit.input);
  });
}
