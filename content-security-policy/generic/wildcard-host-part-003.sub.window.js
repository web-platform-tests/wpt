// META: script=/content-security-policy/support/testharness-helper.js

setup(_ => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "content-security-policy";
  // Default http port is 80.
  meta.content = "connect-src http://*/content-security-policy/support/resource.py";
  document.head.appendChild(meta);
});

promise_test(async t => {
  const url = "http://{{domains[www1]}}/content-security-policy/support/resource.py";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Host wildcard allows arbitrary hosts (www1).");

promise_test(async t => {
  const url = "http://{{domains[www2]}}/content-security-policy/support/resource.py";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Host wildcard allows arbitrary hosts (www2).");

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/content-security-policy/support/resource.py";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url)),
  ]);
}, "Host wildcard doesn't affect port matching.");

promise_test(async t => {
  const url = "http://{{domains[www2]}}/fonts/Ahem.ttf";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url))
  ]);
}, "Host wildcard doesn't affect path matching.");
