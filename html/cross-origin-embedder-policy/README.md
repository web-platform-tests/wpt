See `../cross-origin-opener-policy/README.md`.

## Reporting

### Existing tests ###

- cache-storage-reporting-dedicated-worker.https.html
- cache-storage-reporting-document.https.html
- cache-storage-reporting-service-worker.https.html
- cache-storage-reporting-shared-worker.https.html
- reporting-navigation.https.html
- reporting-subresource-corp.https.html
- reporting-to-endpoint.https.html
- reporting-to-owner.https.html

### Testing plan ###

- test multiple headers with COEP/COEPRO
  - tests: https://github.com/web-platform-tests/wpt/pull/28285
  spec text: "Return the values of all headers in list whose name is a byte-case-insensitive match for name, separated from each other by 0x2C 0x20, in order."
  https://fetch.spec.whatwg.org/#concept-header-list-get
- test "relevant settings object" is the right one:
  - navigation with location.assign invoked as in https://github.com/web-platform-tests/wpt/pull/21206, shouldn't affect which settings object is used per spec.
    - tests: TODO
  - construct a worker normally. "owner" is the "responsible document": https://html.spec.whatwg.org/#relevant-owner-to-add
    - tests: https://github.com/web-platform-tests/wpt/pull/28261
  - construct a worker within a worker. "owner" is the outer worker (not the document).
    - tests: https://github.com/web-platform-tests/wpt/pull/28261
  - construct a worker to differentiate between entry/incumbent/current.
    - tests: https://github.com/web-platform-tests/wpt/pull/28313
  - test that history.pushState() doesn't affect the report's "url"
    - tests: TODO
- test that a CSP failure doesn't give a COEP report. (CSP is checked before COEP)
  - tests: https://github.com/web-platform-tests/wpt/pull/28281
  - spec text: "Otherwise, if the result of Should navigation response to navigation request of type in target be blocked by Content Security Policy? given navigationParams's request, response, navigationType, and browsingContext is "Blocked", then set failure to true. [CSP]"
  https://html.spec.whatwg.org/multipage/browsing-the-web.html#process-a-navigate-response
- test that X-Frame-Options check happens after COEP check (expect a COEP report) (is this order of checks intentional?)
  - tests: https://github.com/web-platform-tests/wpt/pull/28281
  - spec text: "Otherwise, if the result of checking a navigation response's adherence to `X-Frame-Options` given response, browsingContext, and navigationParams's origin is false, then set failure to true."
  https://html.spec.whatwg.org/multipage/browsing-the-web.html#process-a-navigate-response
- test that "about", "blob", and "data" inherit owner's embedder policy, and that other schemes don't.
  - tests:
    - blob.https.html
    - data.https.html
    - javascript.https.html
    - require-corp-about-blank.https.html
    - require-corp-about-srcdoc.https.html
  - spec text: "If response's url's scheme is a local scheme, then set worker global scope's embedder policy to owner's embedder policy."
  https://html.spec.whatwg.org/multipage/workers.html#run-a-worker
- test that .crossOriginIsolated is true for shared worker with COEP: require-corp
  - tests: cross-origin-isolated-permission.https.html
  - spec text: "If worker global scope's embedder policy is "require-corp" and is shared is true, then set agent's agent cluster's cross-origin isolation mode to "logical" or "concrete". The one chosen is implementation-defined."
- test that .crossOriginIsolated dedicated workers equals the document's .crossOriginIsolated (with same COEP values)
  - tests: cross-origin-isolated-permission.https.html
  - spec text: "If is shared is false and owner's cross-origin isolated capability is false, then set worker global scope's cross-origin isolated capability to false."
  https://html.spec.whatwg.org/multipage/workers.html#run-a-worker
- test that .crossOriginIsolated is false for a data: URL dedicated worker
  - tests: cross-origin-isolated-permission.https.html
  - spec text: "If is shared is false and response's url's scheme is "data", then set worker global scope's cross-origin isolated capability to false."
  https://html.spec.whatwg.org/multipage/workers.html#run-a-worker
- test that type (note: different from "report type") is "worker initialization"
  - tests: reporting-to-owner.https.html
- test that blockedURL trims username, password, fragment.
  - tests: TODO


https://w3c.github.io/ServiceWorker/

How does this spec use embedder policy? Does it cause COEP reports to be sent?
