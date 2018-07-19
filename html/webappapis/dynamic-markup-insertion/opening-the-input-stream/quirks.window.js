test(() => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  assert_equals(frame.contentDocument.compatMode, "BackCompat");
  frame.contentDocument.open();
  assert_equals(frame.contentDocument.compatMode, "CSS1Compat");
  frame.contentDocument.write("<!doctype html public");
  assert_equals(frame.contentDocument.compatMode, "CSS1Compat");
  frame.contentDocument.write(" \"-//IETF//DTD HTML 3//\"");
  assert_equals(frame.contentDocument.compatMode, "CSS1Compat");
  frame.contentDocument.write(">");
  assert_equals(frame.contentDocument.compatMode, "BackCompat");
  frame.contentDocument.close();
  assert_equals(frame.contentDocument.compatMode, "BackCompat");
  frame.remove();
}, "document.open() and quirks mode");
