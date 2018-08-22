document.domain = "{{host}}";

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => { iframe.remove(); });
  iframe.onload = t.step_func(() => {
    // Here, the entry settings object is still the iframe's. Delay it in such
    // a way that makes the entry settings object the top-level page's, but
    // without delaying too much that the parser becomes inactive. A microtask
    // is perfect as it's executed in "clean up after running script".
    Promise.resolve().then(t.step_func_done(() => {
      assert_throws("InvalidStateError", () => {
        iframe.contentDocument.open();
      }, "opening an XML document should throw an InvalidStateError");
    }));
  });
  const frameURL = new URL("resources/bailout-order-xml-with-domain-frame.sub.xhtml", document.URL);
  frameURL.port = "{{ports[http][1]}}";
  iframe.src = frameURL.href;
}, "document.open should throw an InvalidStateError with XML document even if it is cross-origin");

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => { iframe.remove(); });
  window.onCustomElementReady = t.step_func(() => {
    window.onCustomElementReady = t.unreached_func("onCustomElementReady called again");
    // Here, the entry settings object is still the iframe's. Delay it in such
    // a way that makes the entry settings object the top-level page's, but
    // without delaying too much that the throw-on-dynamic-markup-insertion
    // counter gets decremented. A microtask is perfect as it's executed in
    // "clean up after running script".
    Promise.resolve().then(t.step_func_done(() => {
      assert_throws("InvalidStateError", () => {
        iframe.contentDocument.open();
      }, "opening a document from a custom element constructor should throw an InvalidStateError");
    }));
  });
  const frameURL = new URL("resources/bailout-order-custom-element-with-domain-frame.sub.html", document.URL);
  frameURL.port = "{{ports[http][1]}}";
  iframe.src = frameURL.href;
}, "document.open should throw an InvalidStateError during custom element constructor even if the document is cross-origin");

async_test(t => {
  const iframe = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => { iframe.remove(); });
  self.testSynchronousScript = t.step_func(() => {
    // Here, the entry settings object is still the iframe's. Delay it in such
    // a way that makes the entry settings object the top-level page's, but
    // without delaying too much that the parser becomes inactive. A microtask
    // is perfect as it's executed in "clean up after running script".
    Promise.resolve().then(t.step_func_done(() => {
      assert_throws("SecurityError", () => {
        iframe.contentDocument.open();
      }, "opening a same origin-domain (but not same origin) document should throw a SecurityError");
    }));
  });
  const frameURL = new URL("resources/bailout-order-synchronous-script-with-domain-frame.sub.html", document.URL);
  frameURL.port = "{{ports[http][1]}}";
  iframe.src = frameURL.href;
}, "document.open should throw a SecurityError with cross-origin document even when there is an active parser executing script");

for (const ev of ["beforeunload", "pagehide", "unload"]) {
  async_test(t => {
    const iframe = document.body.appendChild(document.createElement("iframe"));
    t.add_cleanup(() => { iframe.remove(); });
    iframe.addEventListener("load", t.step_func(() => {
      iframe.contentWindow.addEventListener(ev, t.step_func(() => {
        // Here, the entry settings object could still be the iframe's. Delay
        // it in such a way that makes the entry settings object the top-level
        // page's. A microtask is perfect as it's executed in "clean up after
        // running script".
        Promise.resolve().then(t.step_func_done(() => {
          assert_throws("SecurityError", () => {
            iframe.contentDocument.open();
          }, "opening a same origin-domain (but not same origin) document should throw a SecurityError");
        }));
      }));
      iframe.src = "about:blank";
    }), { once: true });
    iframe.src = "http://{{host}}:{{ports[http][1]}}/common/domain-setter.sub.html";
  }, `document.open should throw a SecurityError with cross-origin document even when the ignore-opens-during-unload counter is greater than 0 (during ${ev} event)`);
}
