test(() => {
  document.body.appendChild(document.createElement('iframe'));
  const script = document.createElement("script");
  script.text = "document.domain = document.domain";
  window[0].document.body.appendChild(script);
  // Ensure we can still access the child browsing context
  assert_equals(window[0].document.body.localName, "body");
}, "Initial about:blank frame and document.domain in the frame");
