async_test(t => {
  const request = new XMLHttpRequest()
  request.open("GET", "resources/mime-types.json")
  request.send()
  request.responseType = "json"
  request.onload = t.step_func_done(() => {
    runTests(request.response)
  })
}, "Loading data…")

function runTests(tests) {
  tests.forEach(val => {
    if(typeof val === "string" || val.navigable !== true) {
      return;
    }
    const mime = val.input;
    async_test(t => {
      const frame = document.createElement("iframe"),
            expectedEncoding = val.encoding === "" ? "UTF-8" : val.encoding;
      t.add_cleanup(() => frame.remove());
      frame.onload = t.step_func(() => {
        if(frame.contentWindow.location.href === "about:blank") {
          return;
        }
        // Edge fails all these tests due to not using the correct encoding label.
        assert_equals(frame.contentDocument.characterSet, expectedEncoding);
        t.done();
      });
      frame.src = "resources/mime-charset.py?type=" + encodeURIComponent(mime);
      document.body.appendChild(frame);
    }, mime);
  });
}
