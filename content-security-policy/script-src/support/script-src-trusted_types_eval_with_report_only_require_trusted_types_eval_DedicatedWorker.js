const testSetupPolicy = trustedTypes.createPolicy("p", { createScriptURL: s => s });
importScripts(testSetupPolicy.createScriptURL("/resources/testharness.js"));

trustedTypes.createPolicy('default', {createScript: s => s});

var evalScriptRan = false;
var setTimeoutScriptRan = false;
var setIntervalScriptRan = false;

const timeout_promise = (t) => new Promise((_, reject) => t.step_timeout(
    () => reject(new Error('Timed out waiting for securitypolicyviolation')), 1000));

promise_test(t => {
  const violation = Promise.race([
    new EventWatcher(t, self, 'securitypolicyviolation')
        .wait_for('securitypolicyviolation')
        .then(e => {
          assert_equals(e.effectiveDirective, 'script-src');
          assert_equals(e.blockedURI, 'eval');
          assert_false(evalScriptRan);
        }),
    timeout_promise(t),
  ]);
  assert_throws_js(Error, () => {
    try {
      eval("evalScriptRan = true;");
    } catch (e) {
      throw new Error();
    }
  });
  return violation;
}, "Scripts injected via direct `eval` are not allowed with `trusted-types-eval` when `require-trusted-types-for 'script'` is report only (Dedicated Worker).");

promise_test(t => {
  const violation = Promise.race([
    new EventWatcher(t, self, 'securitypolicyviolation')
        .wait_for('securitypolicyviolation')
        .then(e => {
          assert_equals(e.effectiveDirective, 'script-src');
          assert_equals(e.blockedURI, 'eval');
          return new Promise(resolve => t.step_timeout(resolve, 0));
        })
        .then(() => assert_false(setTimeoutScriptRan)),
    timeout_promise(t),
  ]);
  const id = setTimeout("setTimeoutScriptRan = true;", 0);
  t.add_cleanup(() => clearTimeout(id));
  return violation;
}, "Scripts injected via `setTimeout` are not allowed with `trusted-types-eval` when `require-trusted-types-for 'script'` is report only (Dedicated Worker).");

promise_test(t => {
  const violation = Promise.race([
    new EventWatcher(t, self, 'securitypolicyviolation')
        .wait_for('securitypolicyviolation')
        .then(e => {
          assert_equals(e.effectiveDirective, 'script-src');
          assert_equals(e.blockedURI, 'eval');
          return new Promise(resolve => t.step_timeout(resolve, 0));
        })
        .then(() => assert_false(setIntervalScriptRan)),
    timeout_promise(t),
  ]);
  const id = setInterval("setIntervalScriptRan = true;", 0);
  t.add_cleanup(() => clearInterval(id));
  return violation;
}, "Scripts injected via `setInterval` are not allowed with `trusted-types-eval` when `require-trusted-types-for 'script'` is report only (Dedicated Worker).");

done();
