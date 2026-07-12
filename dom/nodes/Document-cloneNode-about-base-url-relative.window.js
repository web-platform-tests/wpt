// A relative <base> href in an about:blank document, and how it interacts with
// cloning.
//
// The base URL an about:blank document inherits from its initiator is exposed
// through the no-<base> path (base URL override), so ordinary relative URLs
// resolve against it. A <base> element, however, resolves its href against the
// document's own URL, so a relative <base href="sub/"> resolves against
// about:blank rather than the inherited base URL. Cloning does not change this.
//
// See https://github.com/whatwg/dom/issues/454

function aboutBlankDocument(t) {
  return new Promise(resolve => {
    const iframe = document.createElement("iframe");
    iframe.src = "about:blank";
    iframe.onload = () => resolve(iframe);
    t.add_cleanup(() => iframe.remove());
    document.body.appendChild(iframe);
  });
}

promise_test(async t => {
  const doc = (await aboutBlankDocument(t)).contentDocument;

  const base = doc.createElement("base");
  base.setAttribute("href", "sub/");
  doc.head.appendChild(base);
  assert_equals(doc.baseURI, "about:blank");
}, "A relative <base> in an about:blank document resolves against about:blank");

promise_test(async t => {
  const doc = (await aboutBlankDocument(t)).contentDocument;

  const base = doc.createElement("base");
  base.setAttribute("href", "sub/");
  doc.head.appendChild(base);

  assert_equals(doc.cloneNode(true).baseURI, "about:blank", "deep");
  assert_equals(doc.cloneNode(false).baseURI, "about:blank", "shallow");
}, "Clone of an about:blank document with a relative <base>");
