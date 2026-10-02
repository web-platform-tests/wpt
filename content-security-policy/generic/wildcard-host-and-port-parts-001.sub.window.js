// META: script=/content-security-policy/support/testharness-helper.js

setup(_ => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "content-security-policy";
  meta.content = "connect-src http://*:*/content-security-policy/support/resource.py";
  document.head.appendChild(meta);
});

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/content-security-policy/support/resource.py";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await fetch(url);
}, "host+port wildcard allows arbitrary host:port (www1, {{ports[http][0]}}).");

promise_test(async t => {
  const url = "http://{{domains[www2]}}:{{ports[http][1]}}/content-security-policy/support/resource.py";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await fetch(url);
}, "host+port wildcard allows arbitrary host:port (www2, {{ports[http][1]}}).");

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/fonts/Ahem.ttf";
  await Promise.all([
    waitUntilCSPEventForURL(t, url, "connect-src"),
    promise_rejects_js(t, TypeError, fetch(url))
  ]);
}, "host+port wildcard doesn't affect path matching.");
