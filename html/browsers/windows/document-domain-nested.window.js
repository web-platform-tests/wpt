test(() => {
  document.body.appendChild(document.createElement('iframe'));
  document.domain = document.domain;
  // Ensure we can still access the child browsing context
  assert_equals(window[0].document.body.localName, "body");
}, "Initial about:blank frame and document.domain");
