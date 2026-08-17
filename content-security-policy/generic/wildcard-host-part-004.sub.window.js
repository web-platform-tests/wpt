// META: script=/content-security-policy/support/testharness-helper.js

setup(_ => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "content-security-policy";
  // Default http port is 80.
  meta.content = "connect-src http://*";
  document.head.appendChild(meta);
});

promise_test(async t => {
  const url = "http://{{domains[www1]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Host wildcard allows arbitrary hosts (www1).");

promise_test(async t => {
  const url = "http://{{domains[www2]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Host wildcard allows arbitrary hosts (www2).");

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/images/green-100x100.png";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url)),
  ]);
}, "Host wildcard doesn't affect port matching.");

promise_test(async t => {
  const url = "http://{{domains[www2]}}/images/green-256x256.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Path matching does not apply for empty path-part.");
