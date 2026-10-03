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
