// Tracking test for a relative <base> href in an about:srcdoc document, and how
// it interacts with cloning. Parallels the about:blank case.
//
// Per the "fallback base URL" algorithm, an iframe srcdoc document's base URL is
// its container's base URL, and a <base> element resolves its href against the
// fallback base URL. So a relative <base href="sub/"> should resolve against the
// inherited base URL, both for the document and its clones. Cloning drops the
// container relationship, which is where this gets interesting.
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
  const expected = new URL("sub/", document.baseURI).href;
  assert_equals(doc.baseURI, expected);
}, "A relative <base> in an about:srcdoc document resolves against the inherited base URL");

promise_test(async t => {
  const doc = (await srcdocDocument(t, "<base href='sub/'>x")).contentDocument;
  const expected = new URL("sub/", document.baseURI).href;

  assert_equals(doc.cloneNode(true).baseURI, expected, "deep");
  assert_equals(doc.cloneNode(false).baseURI, expected, "shallow");
}, "Clone of an about:srcdoc document with a relative <base>");
