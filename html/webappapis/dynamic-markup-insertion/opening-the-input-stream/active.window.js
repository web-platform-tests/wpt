test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  assert_equals(frame.contentDocument.childNodes.length, 1);
  assert_equals(frame.contentDocument.open(), frame.contentDocument);
  assert_equals(frame.contentDocument.childNodes.length, 0);
  frame.contentDocument.write("<!DOCTYPE html>");
  assert_equals(frame.contentDocument.childNodes.length, 1);
}, "document.open() removes the document's children (fully active document)");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  frame.onload = t.step_func(() => {
    const childFrame = frame.contentDocument.querySelector("iframe");
    const childDoc = childFrame.contentDocument;
    const childWin = childFrame.contentWindow;

    // Right now childDoc is still fully active.

    frame.onload = t.step_func_done(() => {
      // Now childDoc is still active but no longer fully active.
      assert_equals(childDoc.childNodes.length, 1);
      assert_equals(childDoc.open(), childDoc);
      assert_equals(childDoc.childNodes.length, 0);
      childDoc.write("<!DOCTYPE html>");
      assert_equals(childDoc.childNodes.length, 1);
    });
    frame.src = "/common/blank.html";
  });
  frame.src = "resources/page-with-frame.html";
}, "document.open() removes the document's children (active but not fully active document)");

test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  const doc = frame.contentDocument;

  // Right now the frame is connected and it has an active document.
  frame.remove();

  // Now the frame is no longer connected. Its document is no longer active.
  assert_equals(doc.childNodes.length, 1);
  assert_equals(doc.open(), doc);
  assert_equals(doc.childNodes.length, 0);
  doc.write("<!DOCTYPE html>");
  assert_equals(doc.childNodes.length, 1);
}, "document.open() removes the document's children (non-active document with an associated Window object; frame is removed)");

async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  frame.src = "resources/dummy.html";

  frame.onload = t.step_func(() => {
    const doc = frame.contentDocument;
    // Right now the frame is connected and it has an active document.

    frame.onload = t.step_func_done(() => {
      // Now even though the frame is still connected, its document is no
      // longer active.
      assert_not_equals(frame.contentDocument, doc);
      assert_equals(doc.childNodes.length, 2);
      assert_equals(doc.open(), doc);
      assert_equals(doc.childNodes.length, 0);
      doc.write("<!DOCTYPE html>");
      assert_equals(doc.childNodes.length, 1);
    });

    frame.src = "/common/blank.html";
  });
}, "document.open() does not change document's URL (non-active document with an associated Window object; navigated away)");

test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  const doc = frame.contentDocument.implementation.createHTMLDocument();
  assert_equals(doc.childNodes.length, 2);
  assert_equals(doc.open(), doc);
  assert_equals(doc.childNodes.length, 0);
  doc.write("<!DOCTYPE html>");
  assert_equals(doc.childNodes.length, 1);
}, "document.open() does not change document's URL (non-active document without an associated Window object; createHTMLDocument)");

test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  const doc = new frame.contentWindow.DOMParser().parseFromString("", "text/html");
  assert_equals(doc.childNodes.length, 1);
  assert_equals(doc.open(), doc);
  assert_equals(doc.childNodes.length, 0);
  doc.write("<!DOCTYPE html>");
  assert_equals(doc.childNodes.length, 1);
}, "document.open() does not change document's URL (non-active document without an associated Window object; DOMParser)");
