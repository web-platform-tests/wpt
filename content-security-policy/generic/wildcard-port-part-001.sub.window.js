// META: script=/content-security-policy/support/testharness-helper.js

setup(_ => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "content-security-policy";
  meta.content = "connect-src http://{{host}}:*/images/green-100x100.png";
  document.head.appendChild(meta);
});

promise_test(async t => {
  const url = "http://{{host}}:{{ports[http][0]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await fetch(url);
}, "Port wildcard allows arbitrary port {{ports[http][0]}}.");

promise_test(async t => {
  const url = "http://{{host}}:{{ports[http][1]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Port wildcard allows arbitrary port {{ports[http][1]}}.");

promise_test(async t => {
  const url = "http://{{domains[www2]}}:{{ports[http][0]}}/images/green-100x100.png";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url)),
  ]);
}, "Port wildcard does not affect host matching.");

promise_test(async t => {
  const url = "http://{{host}}:{{ports[http][0]}}/images/red-100x100.png";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url)),
  ]);
}, "Port wildcard does not affect path matching.");
