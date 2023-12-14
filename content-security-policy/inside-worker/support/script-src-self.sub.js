importScripts("{{location[server]}}/resources/testharness.js");
importScripts("{{location[server]}}/content-security-policy/support/testharness-helper.js");
importScripts("{{location[server]}}/reporting/resources/report-helper.js");

let importscripts_url ="https://{{hosts[][www]}}:{{ports[https][1]}}" +
    "/content-security-policy/support/var-a.js";

promise_test(async t => {
  self.a = false;
  assert_throws_dom("NetworkError",
                    _ => importScripts(importscripts_url),
                    "importScripts should throw `NetworkError`");
  assert_false(self.a);
  return waitUntilCSPEventForURL(t, importscripts_url);
}, "Cross-origin `importScripts()` blocked in " + self.location.protocol +
             " with {{GET[test-name]}}");

promise_test(t => {
  assert_throws_js(EvalError,
                   _ => eval("1 + 1"),
                   "`eval()` should throw 'EvalError'.");

  assert_throws_js(EvalError,
                   _ => new Function("1 + 1"),
                   "`new Function()` should throw 'EvalError'.");
  return Promise.all([
    waitUntilCSPEventForEval(t, 20),
    waitUntilCSPEventForEval(t, 24),
  ]);
}, "`eval()` blocked in " + self.location.protocol +
             " with {{GET[test-name]}}");

promise_test(t => {
  self.setTimeoutTest = t;
  let result = setTimeout("(self.setTimeoutTest.unreached_func(" +
                          "'setTimeout([string]) should not execute.'))()", 1);
  assert_equals(result, 0);
  return waitUntilCSPEventForEval(t, 35);
}, "`setTimeout([string])` blocked in " + self.location.protocol +
             " with {{GET[test-name]}}");

promise_test(async t => {
  let response = await pollReports(
      `{{location[server]}}/reporting/resources/report.py`, "{{GET[id]}}",
      {min_count: 4, timeout: 5});
  let reports = response.map(x => x["csp-report"]);

  assert_array_equals(
      reports.map(x => x["blocked-uri"]).sort(),
      [ importscripts_url, "eval", "eval", "eval" ].sort(),
      "Reports do not match");
  assert_array_equals(
      reports.map(x => x["violated-directive"]).sort(),
      [ "script-src-elem", "script-src", "script-src", "script-src" ].sort(),
      "Violated directive in report does not match");
  assert_array_equals(
      reports.map(x => x["effective-directive"]).sort(),
      [ "script-src-elem", "script-src", "script-src", "script-src" ].sort(),
      "Effective directive in report does not match");
  reports.forEach(x => {
    assert_equals(
        x["disposition"], "enforce",
        "Disposition in report does not match");
  });
}, "Reports are sent for " + self.location.protocol +
                  " with {{GET[test-name]}}");

done();
