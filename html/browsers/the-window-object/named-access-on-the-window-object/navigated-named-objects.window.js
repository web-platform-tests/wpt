[
  {
    "namedObject": "<div id=abc></div>",
    "namedObjectLocalName": "div"
  },
  {
    "namedObject": "<object name=abc></object>",
    "namedObjectLocalName": "object"
  },
  {
    "namedObject": "<iframe id=abc></iframe>",
    "namedObjectLocalName": "iframe"
  }
].forEach(testData => {
async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  frame.srcdoc = `<script>function f() { return abc }</script>${testData.namedObject}`;
  let f, associatedAbc;
  frame.onload = t.step_func(() => {
    f = frame.contentWindow.f;
    associatedAbc = f();
    frame.onload = t.step_func_done(() => {
      assert_equals(f(), associatedAbc);
      assert_equals(associatedAbc.localName, testData.namedObjectLocalName);
    });
    frame.srcdoc = "<span id=abc></span>";
  });
  document.body.append(frame);
  }, `Window's associated Document object is used for finding named objects (<${testData.namedObjectLocalName}>)`);
});

async_test(t => {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  frame.srcdoc = "<script>function f() { return abc }</script><object name=abc data='about:blank'></object>";
  let f, associatedAbc, associatedAbcContainer;
  frame.onload = t.step_func(() => {
    f = frame.contentWindow.f;
    associatedAbc = f();
    associatedAbcContainer = associatedAbc.frameElement;
    frame.onload = t.step_func_done(() => {
      assert_equals(f(), associatedAbcContainer);
      assert_equals(associatedAbcContainer.contentWindow, null);
    });
    frame.srcdoc = "<span id=abc></span>";
  });
  document.body.append(frame);
}, "Window's associated Document object is used for finding named objects (<object> with browsing ccontext)");
