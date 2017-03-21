importScripts("{{location[server]}}/resources/testharness.js");
importScripts("{{location[server]}}/content-security-policy/support/testharness-helper.js");

test(t => {
  assert_throws("NetworkError",
                _ => importScripts("http://{{domains[www]}}:{{ports[http][1]}}/content-security-policy/support/fail.js"),
                "importScripts should throw `NetworkError`");
}, "Cross-origin `importScripts()` blocked in " + self.location.protocol + self.location.search);

test(t => {
  // TODO(mkwst): The error event isn't firing. :/

  assert_throws(EvalError(),
                _ => eval("1 + 1"),
                "`eval()` should throw 'EvalError'.");

  assert_throws(EvalError(),
                _ => new Function("1 + 1"),
                "`new Function()` should throw 'EvalError'.");
}, "`eval()` blocked in " + self.location.protocol + self.location.search);

async_test(t => {
  waitUntilCSPEventForEval(t, 27)
    .then(_ => t.done());

  assert_equals(
      setTimeout("assert_unreached('setTimeout([string]) should not execute.')", 0),
      0);
}, "`setTimeout([string])` blocked in " + self.location.protocol + self.location.search);

done();
