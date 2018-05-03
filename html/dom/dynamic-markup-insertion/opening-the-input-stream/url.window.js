test(() => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  assert_equals(frame.contentDocument.URL, "about:blank");
  assert_equals(frame.contentWindow.location.href, "about:blank");
  frame.contentDocument.open();
  assert_equals(frame.contentDocument.URL, document.URL);
  assert_equals(frame.contentWindow.location.href, document.URL);
  // Ensure the load event fires and testharness doesn't timeout
  frame.contentDocument.close();
}, "document.open() and document's URL");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        urlSansHash = document.URL;
  assert_equals(frame.contentDocument.URL, "about:blank");
  assert_equals(frame.contentWindow.location.href, "about:blank");
  self.onhashchange = t.step_func_done(() => {
    frame.contentDocument.open();
    assert_equals(frame.contentDocument.URL, urlSansHash);
    assert_equals(frame.contentWindow.location.href, urlSansHash);
  });
  self.location.hash = "heya";
}, "document.open() and document's URL containing a fragment");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"))
  frame.src = "resources/url-frame.html#heya";
  frame.onload = t.step_func_done(() => {
    assert_equals(frame.contentWindow.beforeURL, frame.src);
    assert_equals(frame.contentWindow.afterURL, frame.src);
    assert_equals(frame.contentDocument.URL, frame.src);
    assert_true(frame.contentWindow.happened);
  });
}, "document.open() and document's URL containing a fragment (entry is current)");
