function openHasTakenEffect(doc) {
  return !doc.childNodes.length;
}

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => { try { iframe.contentDocument.close(); } catch (e) {} });
  iframe.src = "/common/dummy.xhtml";
  iframe.onload = t.step_func_done(() => {
    const origURL = iframe.contentDocument.URL;
    assert_throws("InvalidStateError", () => {
      iframe.contentDocument.open();
    }, "document.open() should throw on XML documents");
    assert_false(openHasTakenEffect(iframe.contentDocument), "document.open() should not clear a XML document's nodes");
    assert_equals(iframe.contentDocument.URL, origURL, "document.open() should keep the original URL on an XML document");
  });
}, "URL should not be changed on a document.open bailout (XML document)");

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => { try { iframe.contentDocument.close(); } catch (e) {} });
  self.testSynchronousScript = t.step_func_done(() => {
    const origURL = iframe.contentDocument.URL;
    iframe.contentDocument.open();
    assert_false(openHasTakenEffect(iframe.contentDocument), "document.open() should not clear a document nodes when executed as a synchronous script");
    assert_equals(iframe.contentDocument.URL, origURL, "document.open() should keep the original URL on a document when executed as a synchronous script");
  });
  iframe.src = "resources/bailout-order-synchronous-script-frame.html";
}, "URL should not be changed on a document.open bailout (synchronous script)");
