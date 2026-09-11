// META: script=/common/get-host-info.sub.js

// Load about:srcdoc in a sandboxed iframe. Check the document.baseURI is
// correct.
const runTest = (description, iframe_sandbox) => {
  promise_test(async test => {
    const iframe = document.createElement("iframe");
    iframe.sandbox = iframe_sandbox;
    iframe.srcdoc = `
      <script>
        parent.postMessage(document.baseURI, '*');
      </scr`+`ipt>
    `;
    const child_base_uri = new Promise(r => onmessage = e => r(e.data));
    document.body.appendChild(iframe);
    // [spec]: https://html.spec.whatwg.org/C/#document-base-url
    // Step 2: If document's base URL override is non-null, then return it. For
    //         an iframe srcdoc document it is a snapshot of the initiator
    //         document's document base URL.
    assert_equals(await child_base_uri, document.baseURI);
  }, description);
}

onload = () => {
  runTest("allow-same-origin", "allow-scripts allow-same-origin");
  runTest("disallow-same-origin", "allow-scripts");
}
