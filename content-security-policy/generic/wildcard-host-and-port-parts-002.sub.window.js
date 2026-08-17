// META: script=/content-security-policy/support/testharness-helper.js

setup(_ => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "content-security-policy";
  meta.content = "connect-src http://*:*";
  document.head.appendChild(meta);
});

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "host+port wildcard allows arbitrary host:port (www1, {{ports[http][0]}}).");

promise_test(async t => {
  const url = "http://{{domains[www2]}}:{{ports[http][1]}}/images/green-100x100.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "host+port wildcard allows arbitrary host:port (www2, {{ports[http][1]}}).");

promise_test(async t => {
  const url = "http://{{domains[www1]}}:{{ports[http][0]}}/images/green-256x256.png";
  assert_no_csp_event_for_url(t, url, "connect-src");
  await promise_rejects_js(t, TypeError, fetch(url));
}, "Path matching does not apply for empty path-part.");
