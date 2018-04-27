test(() => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  assert_equals(frame.contentDocument.compatMode, "BackCompat");
  frame.contentDocument.open();
  assert_equals(frame.contentDocument.compatMode, "BackCompat"); // If you remove this assert the test passes in Chrome/Edge/Safari
  frame.contentDocument.close();
  assert_equals(frame.contentDocument.compatMode, "BackCompat");
  frame.remove();
}, "document.open() and quirks mode");
