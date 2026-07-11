// Tracking test for a relative <base> href in an about:blank document, and how
// it interacts with cloning.
//
// Per the "fallback base URL" algorithm, an about:blank document's fallback
// base URL is its initiator's base URL, and a <base> element resolves its href
// against the fallback base URL. So a relative <base href="sub/"> should resolve
// against the inherited base URL. Browsers currently resolve it against
// "about:blank" instead, which is an open question: fix the browsers or special
// case about:blank in the specification.
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
  const expected = new URL("sub/", doc.baseURI).href;

  const base = doc.createElement("base");
  base.setAttribute("href", "sub/");
  doc.head.appendChild(base);
  assert_equals(doc.baseURI, expected);
}, "A relative <base> in an about:blank document resolves against the inherited base URL");

promise_test(async t => {
  const doc = (await aboutBlankDocument(t)).contentDocument;
  const expected = new URL("sub/", doc.baseURI).href;

  const base = doc.createElement("base");
  base.setAttribute("href", "sub/");
  doc.head.appendChild(base);

  assert_equals(doc.cloneNode(true).baseURI, expected, "deep");
  assert_equals(doc.cloneNode(false).baseURI, expected, "shallow");
}, "Clone of an about:blank document with a relative <base>");
