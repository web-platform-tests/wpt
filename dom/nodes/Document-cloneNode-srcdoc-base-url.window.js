// A relative <base> href in an about:srcdoc document, and how it interacts with
// cloning. Parallels the about:blank case.
//
// The base URL an about:srcdoc document inherits from its container is exposed
// through the no-<base> path (base URL override), so ordinary relative URLs
// resolve against it. A <base> element, however, resolves its href against the
// document's own URL, so a relative <base href="sub/"> resolves against
// about:srcdoc rather than the inherited base URL. Cloning does not change this.
//
// See https://github.com/whatwg/dom/issues/454

function srcdocDocument(t, srcdoc) {
  return new Promise(resolve => {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = srcdoc;
    iframe.onload = () => resolve(iframe);
    t.add_cleanup(() => iframe.remove());
    document.body.appendChild(iframe);
  });
}

promise_test(async t => {
  const doc = (await srcdocDocument(t, "<base href='sub/'>x")).contentDocument;
  assert_equals(doc.baseURI, "about:srcdoc");
}, "A relative <base> in an about:srcdoc document resolves against about:srcdoc");

promise_test(async t => {
  const doc = (await srcdocDocument(t, "<base href='sub/'>x")).contentDocument;

  assert_equals(doc.cloneNode(true).baseURI, "about:srcdoc", "deep");
  assert_equals(doc.cloneNode(false).baseURI, "about:srcdoc", "shallow");
}, "Clone of an about:srcdoc document with a relative <base>");
